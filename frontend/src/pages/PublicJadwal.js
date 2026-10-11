import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { isPastDate, sortSchedules } from "../lib/helpers";
import ScheduleTable from "../components/ScheduleTable";
import WeeklyCalendar from "../components/WeeklyCalendar";
import MonthlyCalendar from "../components/MonthlyCalendar";
import AppFooter from "../components/AppFooter";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Building2, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function PublicJadwal() {
  const navigate = useNavigate();
  const { viewMode } = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterRoom, setFilterRoom] = useState("all");

  useEffect(() => {
    api.get("/schedules", { params: { public: true } }).then((res) => setSchedules(res.data)).catch(() => {});
    api.get("/settings").then((res) => setRooms(res.data.rooms || [])).catch(() => {});
  }, []);

  const active = useMemo(() => sortSchedules(schedules.filter((s) => !isPastDate(s.tanggal))), [schedules]);
  const filtered = useMemo(() => {
    let d = active;
    if (filterDate) d = d.filter((s) => s.tanggal === filterDate);
    if (filterRoom !== "all") d = d.filter((s) => s.ruangan === filterRoom);
    return d;
  }, [active, filterDate, filterRoom]);

  return (
    <div className={`min-h-screen bg-background flex flex-col ${viewMode === "mobile" ? "max-w-[480px] mx-auto border-x border-border shadow-xl" : ""}`}>
      <header className="bg-[#003366] text-white shadow-md">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-white/10 flex items-center justify-center"><Building2 className="h-6 w-6" /></div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-heading leading-tight">Jadwal Ruang Rapat</h1>
              <p className="text-xs sm:text-sm text-blue-200">Kantor Gubernur Kalimantan Timur</p>
            </div>
          </div>
          <button onClick={() => window.open("/display", "_blank")} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-medium transition-colors" data-testid="public-display-btn">
            <Monitor className="h-4 w-4" /> Display
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-end gap-3 mb-4 p-4 rounded-xl border border-border bg-card">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filter Tanggal</label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} data-testid="public-filter-date" />
          </div>
          <div className="min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Filter Ruangan</label>
            <Select value={filterRoom} onValueChange={setFilterRoom}>
              <SelectTrigger data-testid="public-filter-room"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ruangan</SelectItem>
                {rooms.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="tabel">
          <TabsList className="mb-4">
            <TabsTrigger value="tabel" data-testid="public-tab-tabel">Tabel Jadwal</TabsTrigger>
            <TabsTrigger value="kalender" data-testid="public-tab-kalender">Kalender Mingguan</TabsTrigger>
            <TabsTrigger value="bulanan" data-testid="public-tab-bulanan">Kalender Bulanan</TabsTrigger>
          </TabsList>
          <TabsContent value="tabel">
            <ScheduleTable schedules={filtered} isAdmin={false} />
          </TabsContent>
          <TabsContent value="kalender">
            <div className="rounded-xl border border-border bg-card p-4">
              <WeeklyCalendar schedules={active} rooms={rooms} />
            </div>
          </TabsContent>
          <TabsContent value="bulanan">
            <div className="rounded-xl border border-border bg-card p-4">
              <MonthlyCalendar schedules={schedules} rooms={rooms} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AppFooter />
    </div>
  );
}
