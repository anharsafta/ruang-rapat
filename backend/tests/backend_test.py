"""Backend API tests for Sistem Penjadwalan Ruang Rapat."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://rapat-kaltim.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": "Admin", "password": "Urdal"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["username"] == "Admin"
    assert isinstance(data["token"], str) and len(data["token"]) > 10
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_wrong(self):
        r = requests.post(f"{API}/auth/login", json={"username": "x", "password": "y"}, timeout=30)
        assert r.status_code == 401

    def test_me(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["username"] == "Admin"

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401


# ---------------- Settings ----------------
class TestSettings:
    def test_get_settings(self):
        r = requests.get(f"{API}/settings", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "footer1" in d and "rooms" in d and "petugas" in d
        assert isinstance(d["rooms"], list) and len(d["rooms"]) > 0

    def test_update_settings_requires_auth(self):
        r = requests.put(f"{API}/settings", json={
            "footer1": "x", "footer2": "y", "rooms": [], "petugas": []
        }, timeout=30)
        assert r.status_code == 401


# ---------------- Schedules ----------------
class TestSchedules:
    def test_list_public(self):
        r = requests.get(f"{API}/schedules?public=true", timeout=30)
        assert r.status_code == 200
        for d in r.json():
            assert "no_wa" not in d

    def test_crud_and_conflict(self, auth_headers):
        payload = {
            "tanggal": "2027-01-15",
            "ruangan": "TEST_Room_Z",
            "jam_mulai": "10:00",
            "jam_selesai": "11:00",
            "pengguna": "TEST_User",
            "kegiatan": "TEST_Kegiatan",
            "zoom": False,
            "nama_peminjam": "TEST",
            "no_wa": "08123",
            "petugas_pencatat": "Susi",
            "surat_files": [],
        }
        # Create
        r = requests.post(f"{API}/schedules", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]

        # Verify in list (admin)
        r = requests.get(f"{API}/schedules", timeout=30)
        ids = [d["id"] for d in r.json()]
        assert sid in ids

        # Conflict
        conflict_payload = {**payload, "jam_mulai": "10:30", "jam_selesai": "11:30"}
        r = requests.post(f"{API}/schedules", json=conflict_payload, headers=auth_headers, timeout=30)
        assert r.status_code == 409

        # Invalid time range
        r = requests.post(f"{API}/schedules", json={**payload, "jam_mulai": "12:00", "jam_selesai": "11:00"},
                          headers=auth_headers, timeout=30)
        assert r.status_code == 400

        # Update
        upd = {**payload, "kegiatan": "TEST_Updated"}
        r = requests.put(f"{API}/schedules/{sid}", json=upd, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["kegiatan"] == "TEST_Updated"

        # Public strips no_wa
        r = requests.get(f"{API}/schedules?public=true", timeout=30)
        found = [d for d in r.json() if d["id"] == sid]
        assert found and "no_wa" not in found[0]

        # Create requires auth
        r = requests.post(f"{API}/schedules", json=payload, timeout=30)
        assert r.status_code == 401

        # Delete
        r = requests.delete(f"{API}/schedules/{sid}", headers=auth_headers, timeout=30)
        assert r.status_code == 200

        # Delete non-existing
        r = requests.delete(f"{API}/schedules/{sid}", headers=auth_headers, timeout=30)
        assert r.status_code == 404


# ---------------- Upload ----------------
class TestUpload:
    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/upload", files={"file": ("t.png", b"x", "image/png")}, timeout=30)
        assert r.status_code == 401

    def test_upload_png(self, auth_headers):
        # minimal PNG
        from PIL import Image
        buf = io.BytesIO()
        Image.new("RGB", (10, 10), (255, 0, 0)).save(buf, format="PNG")
        buf.seek(0)
        r = requests.post(f"{API}/upload", files={"file": ("test.png", buf.getvalue(), "image/png")},
                          headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "storage_path" in d and "id" in d

        # Fetch file
        r2 = requests.get(f"{BASE_URL}/api/files/{d['storage_path']}", timeout=30)
        assert r2.status_code == 200

    def test_upload_bad_format(self, auth_headers):
        r = requests.post(f"{API}/upload", files={"file": ("t.exe", b"x", "application/octet-stream")},
                          headers=auth_headers, timeout=30)
        assert r.status_code == 400
