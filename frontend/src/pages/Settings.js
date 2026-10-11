import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fileUrl, formatApiError } from "../lib/api";
import AppFooter from "../components/AppFooter";
import SuccessPopup from "../components/SuccessPopup";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Slider } from "../components/ui/slider";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Upload, Image as ImageIcon, Save, Building2 } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [newRoom, setNewRoom] = useState("");
  const [newPetugas, setNewPetugas] = useState("");
  const [success, setSuccess] = useState(false);
  const bgRef = useRef();
  const favRef = useRef();

  const load = () => api.get("/settings").then((res) => setS(res.data));
  useEffect(() => { load(); }, []);

  const save = async (next, msg = "Perubahan Berhasil") => {
    try {
      const res = await api.put("/settings", next);
      setS(res.data);
      setSuccess(true);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal menyimpan");
    }
  };

  const upload = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.storage_path;
  };

  if (!s) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-[#003366] text-white shadow-md">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate("/dashboard")} data-testid="settings-back-btn"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2"><Building2 className="h-5 w-5" /><h1 className="text-lg font-bold font-heading">Pengaturan</h1></div>
        </div>
      </header>

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Footer texts */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold font-heading mb-4">Teks Footer Display</h2>
          <div className="space-y-4">
            <div>
              <Label>Footer 1 (Running Text)</Label>
              <Textarea value={s.footer1} onChange={(e) => setS({ ...s, footer1: e.target.value })} className="mt-1" rows={2} data-testid="settings-footer1" />
            </div>
            <div>
              <Label>Footer 2 (Informasi)</Label>
              <Textarea value={s.footer2} onChange={(e) => setS({ ...s, footer2: e.target.value })} className="mt-1" rows={3} data-testid="settings-footer2" />
            </div>
            <Button onClick={() => save(s)} className="bg-[#003366] hover:bg-[#002347] text-white" data-testid="settings-save-footer"><Save className="h-4 w-4 mr-2" /> Simpan Footer</Button>
          </div>
        </Card>

        {/* Rooms */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold font-heading mb-4">Kelola Ruang Rapat</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nama ruangan baru" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} data-testid="settings-new-room" />
            <Button onClick={() => { if (!newRoom.trim()) return; save({ ...s, rooms: [...s.rooms, newRoom.trim()] }); setNewRoom(""); }} className="bg-[#003366] hover:bg-[#002347] text-white shrink-0" data-testid="settings-add-room"><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {s.rooms.map((r) => (
              <div key={r} className="flex items-center gap-2 rounded-full border border-border bg-accent/50 pl-3 pr-1.5 py-1 text-sm" data-testid={`room-item-${r}`}>
                {r}
                <button onClick={() => save({ ...s, rooms: s.rooms.filter((x) => x !== r) })} className="rounded-full p-0.5 hover:bg-destructive/20" data-testid={`room-delete-${r}`}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
              </div>
            ))}
          </div>
        </Card>

        {/* Petugas */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold font-heading mb-4">Kelola Petugas Pencatat</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nama petugas baru" value={newPetugas} onChange={(e) => setNewPetugas(e.target.value)} data-testid="settings-new-petugas" />
            <Button onClick={() => { if (!newPetugas.trim()) return; save({ ...s, petugas: [...s.petugas, newPetugas.trim()] }); setNewPetugas(""); }} className="bg-[#003366] hover:bg-[#002347] text-white shrink-0" data-testid="settings-add-petugas"><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {s.petugas.map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-full border border-border bg-accent/50 pl-3 pr-1.5 py-1 text-sm" data-testid={`petugas-item-${p}`}>
                {p}
                <button onClick={() => save({ ...s, petugas: s.petugas.filter((x) => x !== p) })} className="rounded-full p-0.5 hover:bg-destructive/20" data-testid={`petugas-delete-${p}`}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
              </div>
            ))}
          </div>
        </Card>

        {/* Login background */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold font-heading mb-4">Background Halaman Login</h2>
          <input ref={bgRef} type="file" accept=".jpg,.jpeg,.png,.webp" hidden data-testid="settings-bg-input"
            onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const p = await upload(f); save({ ...s, login_bg_path: p }); } catch { toast.error("Gagal unggah"); } }} />
          <div className="flex items-center gap-3 mb-4">
            <Button variant="outline" onClick={() => bgRef.current?.click()} data-testid="settings-bg-upload"><Upload className="h-4 w-4 mr-2" /> Upload Background</Button>
            {s.login_bg_path && <Button variant="ghost" className="text-destructive" onClick={() => save({ ...s, login_bg_path: null })} data-testid="settings-bg-remove">Hapus (Default Putih)</Button>}
          </div>
          {s.login_bg_path && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border h-40">
                <img src={fileUrl(s.login_bg_path)} alt="bg" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${s.login_bg_darkness / 100})` }} />
              </div>
              <div>
                <Label>Tingkat Kegelapan: {s.login_bg_darkness}%</Label>
                <Slider value={[s.login_bg_darkness]} min={0} max={90} step={5} className="mt-2" data-testid="settings-darkness-slider"
                  onValueChange={(v) => setS({ ...s, login_bg_darkness: v[0] })} onValueCommit={(v) => save({ ...s, login_bg_darkness: v[0] })} />
              </div>
            </div>
          )}
        </Card>

        {/* Favicon */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold font-heading mb-4">Favicon</h2>
          <input ref={favRef} type="file" accept=".png,.jpg,.jpeg,.webp" hidden data-testid="settings-favicon-input"
            onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const p = await upload(f); save({ ...s, favicon_path: p }); } catch { toast.error("Gagal unggah"); } }} />
          <div className="flex items-center gap-3">
            {s.favicon_path ? <img src={fileUrl(s.favicon_path)} alt="favicon" className="h-10 w-10 rounded border border-border" /> : <div className="h-10 w-10 rounded border border-border flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}
            <Button variant="outline" onClick={() => favRef.current?.click()} data-testid="settings-favicon-upload"><Upload className="h-4 w-4 mr-2" /> Upload Favicon</Button>
          </div>
        </Card>
      </main>

      <AppFooter />
      <SuccessPopup open={success} onClose={() => setSuccess(false)} />
    </div>
  );
}
