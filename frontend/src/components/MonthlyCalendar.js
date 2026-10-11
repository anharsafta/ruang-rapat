import { useState } from "react";
import { BULAN, HARI, todayStr, roomChipStyle } from "../lib/helpers";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const HARI_HDR = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function dateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MonthlyCalendar({ schedules, onDateClick }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const first = new Date(cursor.y, cursor.m, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const today = todayStr();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate = {};
  schedules.forEach((s) => { (byDate[s.tanggal] = byDate[s.tanggal] || []).push(s); });

  const prev = () => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const next = () => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  return (
    <div data-testid="monthly-calendar">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-heading">{BULAN[cursor.m]} {cursor.y}</h3>
        <div className="flex items-center gap-2">
          <button data-testid="month-prev" onClick={prev} className="rounded-md border border-border p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
          <button data-testid="month-today" onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Hari Ini</button>
          <button data-testid="month-next" onClick={next} className="rounded-md border border-border p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {HARI_HDR.map((h) => (
          <div key={h} className="text-center text-xs font-semibold text-muted-foreground uppercase py-1">{h}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="min-h-[96px] rounded-lg bg-accent/20" />;
          const ds = dateStr(cursor.y, cursor.m, d);
          const items = (byDate[ds] || []).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
          const isToday = ds === today;
          const clickable = !!onDateClick;
          return (
            <div key={i} data-testid={`month-cell-${ds}`} onClick={clickable ? () => onDateClick(ds) : undefined}
              className={`group min-h-[96px] rounded-lg border p-1.5 transition-colors ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"} ${clickable ? "cursor-pointer hover:border-primary hover:bg-primary/5" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{d}</span>
                {clickable && <Plus className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((s) => (
                  <div key={s.id} className="rounded px-1.5 py-0.5 leading-tight" style={roomChipStyle(s.ruangan)} title={`${s.jam_mulai}-${s.jam_selesai} ${s.ruangan} — ${s.kegiatan}`}>
                    <div className="text-[10px] font-semibold truncate">{s.jam_mulai} {s.ruangan}</div>
                  </div>
                ))}
                {items.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{items.length - 3} lagi</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
