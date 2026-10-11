import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, BACKEND_URL } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { isPastDate, sortSchedules } from "../lib/helpers";
import ScheduleTable from "../components/ScheduleTable";
import ScheduleForm from "../components/ScheduleForm";
import ExportDialog from "../components/ExportDialog";
import WeeklyCalendar from "../components/WeeklyCalendar";
import MonthlyCalendar from "../components/MonthlyCalendar";
import SuccessPopup from "../components/SuccessPopup";
import AppFooter from "../components/AppFooter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Printer, Share2, Monitor, Settings as SettingsIcon, LogOut, Building2, Filter, Copy, Check, CalendarCheck } from "lucide-react";

const MAX_ROWS = 40;

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { viewMode } = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [settings, setSettings] = useState({ rooms: [], petugas: [] });
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRoom, setFilterRoom] = useState("all");
  const [onlyNoSurat, setOnlyNoSurat] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [presetDate, setPresetDate] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editConfirm, setEditConfirm] = useState(null);
  const [success, setSuccess] = useState(false);

  const load = () => {
    api.get("/schedules").then((res) => setSchedules(res.data)).catch(() => toast.error("Gagal memuat jadwal"));
  };

  useEffect(() => {
    load();
    api.get("/settings").then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const activeSchedules = useMemo(() => sortSchedules(schedules.filter((s) => !isPastDate(s.tanggal))), [schedules]);

  const noSuratCount = useMemo(() => activeSchedules.filter((s) => !s.surat_files || s.surat_files.length === 0).length, [activeSchedules]);

  const filtered = useMemo(() => {
    let data = activeSchedules;
    if (filterDate) data = data.filter((s) => s.tanggal === filterDate);
    if (filterRoom !== "all") data = data.filter((s) => s.ruangan === filterRoom);
    if (onlyNoSurat) data = data.filter((s) => !s.surat_files || s.surat_files.length === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((s) => s.kegiatan.toLowerCase().includes(q) || s.pengguna.toLowerCase().includes(q) || s.ruangan.toLowerCase().includes(q));
    }
    return data.slice(0, MAX_ROWS);
  }, [activeSchedules, filterDate, filterRoom, onlyNoSurat, search]);

  const publicLink = `${window.location.origin}/jadwal`;

  const onSaved = (wasEdit) => {
    load();
    if (wasEdit) setSuccess(true);
    else toast.success("Jadwal berhasil ditambahkan");
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/schedules/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
      setSuccess(true);
    } catch { toast.error("Gagal menghapus"); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Link disalin");
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col ${viewMode === "mobile" ? "max-w-[480px] mx-auto border-x border-border shadow-xl" : ""}`}>
      {/* Header */}
      <header className="bg-[#003366] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center"><Building2 className="h-6 w-6" /></div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-heading leading-tight">Sistem Penjadwalan Ruang Rapat</h1>
              <p className="text-xs text-blue-200">Kantor Gubernur Kalimantan Timur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="hidden sm:inline-flex" onClick={() => window.open("/display", "_blank")} data-testid="header-display-btn">
              <Monitor className="h-4 w-4 mr-1.5" /> Display
            </Button>
            <Button size="icon" variant="secondary" className="h-9 w-9" onClick={() => navigate("/setting")} data-testid="header-settings-btn">
              <SettingsIcon className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-white/10" onClick={() => { logout(); navigate("/"); }} data-testid="header-logout-btn">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <Button size="lg" className="bg-[#003366] hover:bg-[#002347] text-white self-start" onClick={() => { setEditData(null); setPresetDate(null); setFormOpen(true); }} data-testid="input-jadwal-baru-btn">
            <Plus className="h-5 w-5 mr-2" /> INPUT JADWAL BARU
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <span data-testid="count-terjadwal" className="inline-flex items-center gap-1.5 rounded-full bg-[#003366]/10 text-[#003366] dark:bg-blue-500/20 dark:text-blue-300 px-3.5 py-1.5 text-sm font-semibold">
              <CalendarCheck className="h-4 w-4" /> {activeSchedules.length} Terjadwal
            </span>
            <Button variant="outline" onClick={() => setExportOpen(true)} data-testid="cetak-rekap-btn"><Printer className="h-4 w-4 mr-1.5" /> Cetak Rekap</Button>
            <Button variant="outline" onClick={() => setShareOpen(true)} data-testid="share-jadwal-btn"><Share2 className="h-4 w-4 mr-1.5" /> Share Jadwal</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-4 p-4 rounded-xl border border-border bg-card">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Cari</label>
            <Input placeholder="Cari kegiatan / unit / ruangan" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="filter-search" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tanggal</label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} data-testid="filter-date" />
          </div>
          <div className="min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Ruangan</label>
            <Select value={filterRoom} onValueChange={setFilterRoom}>
              <SelectTrigger data-testid="filter-room"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ruangan</SelectItem>
                {settings.rooms.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant={onlyNoSurat ? "default" : "outline"} onClick={() => setOnlyNoSurat((v) => !v)} data-testid="filter-no-surat"
            className={onlyNoSurat ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}>
            <Filter className="h-4 w-4 mr-1.5" /> Belum Bersurat
          </Button>
          {(filterDate || filterRoom !== "all" || onlyNoSurat || search) && (
            <Button variant="ghost" onClick={() => { setFilterDate(""); setFilterRoom("all"); setOnlyNoSurat(false); setSearch(""); }} data-testid="filter-reset">Reset</Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-sm">
          <p className="text-muted-foreground" data-testid="table-info">
            Menampilkan <b>{filtered.length}</b> jadwal (maks. {MAX_ROWS}){" "}
            {noSuratCount > 0 && <span className="text-amber-600 font-medium">· {noSuratCount} jadwal belum melampirkan surat</span>}
          </p>
        </div>

        <Tabs defaultValue="tabel">
          <TabsList className="mb-4">
            <TabsTrigger value="tabel" data-testid="tab-tabel">Tabel Jadwal</TabsTrigger>
            <TabsTrigger value="kalender" data-testid="tab-kalender">Kalender Mingguan</TabsTrigger>
            <TabsTrigger value="bulanan" data-testid="tab-bulanan">Kalender Bulanan</TabsTrigger>
          </TabsList>
          <TabsContent value="tabel">
            <ScheduleTable schedules={filtered} isAdmin onEdit={(s) => setEditConfirm(s)} onDelete={(s) => setDeleteTarget(s)} />
          </TabsContent>
          <TabsContent value="kalender">
            <div className="rounded-xl border border-border bg-card p-4">
              <WeeklyCalendar schedules={activeSchedules} rooms={settings.rooms} />
            </div>
          </TabsContent>
          <TabsContent value="bulanan">
            <div className="rounded-xl border border-border bg-card p-4">
              <MonthlyCalendar schedules={schedules} rooms={settings.rooms} onDateClick={(ds) => { setEditData(null); setPresetDate(ds); setFormOpen(true); }} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AppFooter />

      <ScheduleForm open={formOpen} onOpenChange={setFormOpen} rooms={settings.rooms} petugas={settings.petugas} editData={editData} initialDate={presetDate} onSaved={onSaved} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} schedules={schedules} />
      <SuccessPopup open={success} onClose={() => setSuccess(false)} />

      {/* Share dialog */}
      <AlertDialog open={shareOpen} onOpenChange={setShareOpen}>
        <AlertDialogContent data-testid="share-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Share Jadwal (Link Publik)</AlertDialogTitle>
            <AlertDialogDescription>Bagikan link ini untuk melihat jadwal tanpa login (read-only).</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={publicLink} data-testid="share-link-input" />
            <Button onClick={copyLink} data-testid="share-copy-btn" className="bg-[#003366] hover:bg-[#002347] text-white">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <AlertDialogFooter><AlertDialogCancel>Tutup</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit confirm */}
      <AlertDialog open={!!editConfirm} onOpenChange={(o) => !o && setEditConfirm(null)}>
        <AlertDialogContent data-testid="edit-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin mengubah jadwal ini?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction data-testid="edit-confirm-yes" onClick={() => { setEditData(editConfirm); setEditConfirm(null); setFormOpen(true); }}>Ya, Ubah</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="delete-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus jadwal <b>{deleteTarget?.kegiatan}</b>? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction data-testid="delete-confirm-yes" onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
