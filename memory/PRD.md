# PRD — Sistem Penjadwalan Ruang Rapat (Kantor Gubernur Kalimantan Timur)

## Original Problem Statement
Web sederhana penjadwalan ruang rapat untuk Kantor Gubernur Kalimantan Timur dengan 15 ruangan, input/edit/hapus jadwal, cek bentrok, upload surat (object storage + kompresi gambar), ekspor PDF/Excel, share link publik, halaman publik read-only (/jadwal), papan display gaya bandara (/display), halaman setting, login admin tunggal (Admin/Urdal). Tema putih + biru instansi, layout maks 1800px, toggle web/mobile & gelap/terang.

## Architecture
- Backend: FastAPI + MongoDB (motor). Routes under /api. JWT auth (single hardcoded admin via env). Emergent Object Storage for surat. Pillow compresses images (quality 40, max 1600px); PDFs stored as-is.
- Frontend: React 19 + react-router v7 + Tailwind + shadcn/ui. ThemeContext (dark/light + web/mobile), AuthContext (Bearer token in localStorage 'rapat_token').

## User Personas
- Admin (Setda operator): mengelola jadwal, surat, rekap, pengaturan.
- Publik/Unit kerja: melihat jadwal (read-only) via /jadwal.
- Layar TV lobi: /display (papan gaya bandara, auto-reload 2 menit).

## Core Requirements (static)
- 15 ruangan default, susunan kursi khusus Ruhui Rahayu (U-Shape/Theater/Tanpa Kursi).
- Cek bentrok waktu per ruangan (overlap → 409).
- Jam mulai/selesai bebas; tanggal lewat disembunyikan tapi tetap tersimpan utk rekap; maks 40 baris tampil.
- /jadwal menyembunyikan No WA.
- Status display: TERJADWAL (merah), SEGERA DIGUNAKAN (kuning, <30 mnt), SEDANG BERLANGSUNG (biru), SELESAI (putih). Maks 10 baris terlama→terbaru.

## Implemented (2026-06, verified by testing agent 100% BE/FE)
- Login admin (Admin/Urdal) → /dashboard; ProtectedRoute.
- Dashboard: tabel, filter (cari/tanggal/ruangan/belum-bersurat), badge "Belum ada surat" + hitungan, tab Kalender Mingguan, INPUT JADWAL BARU, edit/hapus dgn konfirmasi + popup "Perubahan Berhasil".
- ScheduleForm: semua field + upload surat (maks 3, jpg/png/webp/pdf) ke object storage, susunan kursi Ruhui Rahayu.
- Cek bentrok (409 + toast). Cetak Rekap (PDF/Excel + pilih kolom + rentang tanggal). Share Jadwal (link publik).
- /jadwal read-only (tabel + kalender, tanpa No WA, tanpa aksi). /display papan bandara gelap + marquee footer + auto-reload 2 mnt.
- /setting: footer 1/2, kelola ruangan, kelola petugas, background login + kegelapan, favicon.
- Footer toggle web/mobile & gelap/terang.

## Backlog / Remaining (P2, optional)
- Ganti native date input dengan shadcn Calendar/DatePicker (konsistensi desain).
- Tambah DialogDescription utk membungkam warning a11y.

## Next Tasks
- Tunggu feedback user untuk penyesuaian konten (nama ruangan/petugas) & gaya.
