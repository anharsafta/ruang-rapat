import { useState } from "react";
import { HARI_FULL, BULAN, todayStr } from "../lib/helpers";
import { ChevronLeft, ChevronRight } from "lucide-react";

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function WeeklyCalendar({ schedules }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekEnd = days[6];
  const label = `${weekStart.getDate()} ${BULAN[weekStart.getMonth()]} - ${weekEnd.getDate()} ${BULAN[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  const today = todayStr();

  const colors = ["border-l-blue-500", "border-l-amber-500", "border-l-emerald-500", "border-l-rose-500", "border-l-violet-500"];

  return (
    <div data-testid="weekly-calendar">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-heading">Kalender Mingguan</h3>
        <div className="flex items-center gap-2">
          <button
            data-testid="calendar-prev-week"
            onClick={() => setWeekStart((w) => { const n = new Date(w); n.setDate(w.getDate() - 7); return n; })}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          ><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-medium min-w-[220px] text-center">{label}</span>
          <button
            data-testid="calendar-next-week"
            onClick={() => setWeekStart((w) => { const n = new Date(w); n.setDate(w.getDate() + 7); return n; })}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          ><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((d, i) => {
          const ds = dateStr(d);
          const items = schedules
            .filter((s) => s.tanggal === ds)
            .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
          const isToday = ds === today;
          return (
            <div key={i} className={`rounded-xl border p-2 min-h-[140px] ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <div className="mb-2 text-center">
                <div className="text-xs text-muted-foreground">{HARI_FULL[d.getDay()]}</div>
                <div className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
              </div>
              <div className="space-y-1.5">
                {items.length === 0 && <p className="text-[10px] text-muted-foreground text-center">—</p>}
                {items.map((s, idx) => (
                  <div key={s.id} className={`rounded-md bg-accent/60 border-l-2 ${colors[idx % colors.length]} px-2 py-1`}>
                    <div className="text-[11px] font-semibold leading-tight">{s.jam_mulai}-{s.jam_selesai}</div>
                    <div className="text-[11px] font-medium leading-tight truncate" title={s.ruangan}>{s.ruangan}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight truncate" title={s.kegiatan}>{s.kegiatan}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
