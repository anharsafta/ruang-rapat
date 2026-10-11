import { useEffect, useRef, useState } from "react";
import { api, formatApiError } from "../lib/api";
import { SEATING_OPTIONS, RUHUI, todayStr } from "../lib/helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { toast } from "sonner";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

const EMPTY = {
  tanggal: todayStr(), ruangan: "", jam_mulai: "08:00", jam_selesai: "09:00",
  pengguna: "", kegiatan: "", zoom: false, susunan: null,
  nama_peminjam: "", no_wa: "", petugas_pencatat: "", surat_files: [],
};

export default function ScheduleForm({ open, onOpenChange, rooms, petugas, editData, initialDate, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (open) setForm(editData ? { ...EMPTY, ...editData } : { ...EMPTY, tanggal: initialDate || todayStr() });
  }, [open, editData, initialDate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isRuhui = form.ruangan === RUHUI;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (form.surat_files.length + files.length > 3) {
      toast.error("Maksimal 3 berkas surat");
      return;
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        uploaded.push(res.data);
      }
      set("surat_files", [...form.surat_files, ...uploaded]);
      toast.success("Surat diunggah");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Gagal mengunggah");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeFile = (id) => set("surat_files", form.surat_files.filter((f) => f.id !== id));

  const submit = async () => {
    if (!form.ruangan) return toast.error("Pilih ruangan");
    if (!form.pengguna.trim()) return toast.error("Isi pengguna / unit kerja");
    if (!form.kegiatan.trim()) return toast.error("Isi kegiatan / rapat");
    if (!form.petugas_pencatat) return toast.error("Pilih petugas pencatat");
    if (form.jam_selesai <= form.jam_mulai) return toast.error("Jam selesai harus setelah jam mulai");

    const payload = { ...form, susunan: isRuhui ? form.susunan : null };
    setSaving(true);
    try {
      if (editData) await api.put(`/schedules/${editData.id}`, payload);
      else await api.post("/schedules", payload);
      onSaved(!!editData);
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="schedule-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">{editData ? "Ubah Jadwal Rapat" : "Input Jadwal Baru"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div>
            <Label>Tanggal</Label>
            <Input type="date" data-testid="form-tanggal" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Ruangan</Label>
            <Select value={form.ruangan} onValueChange={(v) => set("ruangan", v)}>
              <SelectTrigger className="mt-1" data-testid="form-ruangan"><SelectValue placeholder="Pilih ruangan" /></SelectTrigger>
              <SelectContent>
                {rooms.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Jam Mulai</Label>
            <Input type="time" data-testid="form-jam-mulai" value={form.jam_mulai} onChange={(e) => set("jam_mulai", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Jam Selesai</Label>
            <Input type="time" data-testid="form-jam-selesai" value={form.jam_selesai} onChange={(e) => set("jam_selesai", e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label>Pengguna (Unit Kerja)</Label>
            <Input data-testid="form-pengguna" value={form.pengguna} onChange={(e) => set("pengguna", e.target.value)} placeholder="cth: Biro Umum Setda" className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label>Kegiatan / Rapat</Label>
            <Textarea data-testid="form-kegiatan" value={form.kegiatan} onChange={(e) => set("kegiatan", e.target.value)} placeholder="Judul / agenda rapat" className="mt-1" rows={2} />
          </div>

          <div className="sm:col-span-2 rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">Fasilitas: Alat Zoom</Label>
              <Switch data-testid="form-zoom" checked={form.zoom} onCheckedChange={(v) => set("zoom", v)} />
            </div>
            {isRuhui && (
              <div className="pt-2 border-t border-border">
                <Label className="text-sm">Susunan Kursi (khusus Ruhui Rahayu)</Label>
                <RadioGroup className="mt-2 flex flex-wrap gap-4" value={form.susunan || ""} onValueChange={(v) => set("susunan", v)}>
                  {SEATING_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={opt} data-testid={`form-susunan-${opt}`} />
                      <Label htmlFor={opt} className="cursor-pointer font-normal">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          <div>
            <Label>Nama Peminjam</Label>
            <Input data-testid="form-nama-peminjam" value={form.nama_peminjam} onChange={(e) => set("nama_peminjam", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>No. WA</Label>
            <Input data-testid="form-no-wa" value={form.no_wa} onChange={(e) => set("no_wa", e.target.value)} placeholder="08xxxx" className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label>Petugas Pencatat</Label>
            <Select value={form.petugas_pencatat} onValueChange={(v) => set("petugas_pencatat", v)}>
              <SelectTrigger className="mt-1" data-testid="form-petugas"><SelectValue placeholder="Pilih petugas" /></SelectTrigger>
              <SelectContent>
                {petugas.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label>Upload Surat (maks. 3 berkas — JPG/PNG/WEBP/PDF)</Label>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple hidden onChange={handleFiles} data-testid="form-surat-input" />
            <Button type="button" variant="outline" className="mt-1 w-full" disabled={uploading || form.surat_files.length >= 3}
              onClick={() => fileRef.current?.click()} data-testid="form-surat-button">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Mengunggah..." : "Pilih Berkas Surat"}
            </Button>
            <div className="mt-2 space-y-1.5">
              {form.surat_files.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-md bg-accent px-3 py-1.5 text-sm">
                  <span className="flex items-center gap-2 truncate">
                    {f.content_type === "application/pdf" ? <FileText className="h-4 w-4 shrink-0" /> : <ImageIcon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{f.original_filename}</span>
                  </span>
                  <button onClick={() => removeFile(f.id)} data-testid={`remove-surat-${f.id}`} className="text-destructive hover:opacity-70"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="form-cancel">Batal</Button>
          <Button onClick={submit} disabled={saving} data-testid="form-submit" className="bg-[#003366] hover:bg-[#002347] text-white">
            {saving ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Simpan Jadwal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
