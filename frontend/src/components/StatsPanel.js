import { useMemo } from "react";
import { Card } from "../components/ui/card";
import { BarChart3, Building2, Clock, CalendarCheck } from "lucide-react";

export default function StatsPanel({ schedules }) {
  const { topRooms, busiest, total } = useMemo(() => {
    const roomCount = {};
    const hourCount = {};
    schedules.forEach((s) => {
      roomCount[s.ruangan] = (roomCount[s.ruangan] || 0) + 1;
      const start = parseInt(s.jam_mulai.split(":")[0], 10);
      const end = parseInt(s.jam_selesai.split(":")[0], 10);
      for (let h = start; h < Math.max(end, start + 1); h++) hourCount[h] = (hourCount[h] || 0) + 1;
    });
    const topRooms = Object.entries(roomCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const busiest = Object.entries(hourCount).map(([h, c]) => [parseInt(h, 10), c]).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .sort((a, b) => a[0] - b[0]);
    return { topRooms, busiest, total: schedules.length };
  }, [schedules]);

  const maxRoom = topRooms.length ? topRooms[0][1] : 1;
  const maxHour = busiest.length ? Math.max(...busiest.map((b) => b[1])) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6" data-testid="stats-panel">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1 text-muted-foreground"><CalendarCheck className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Total Jadwal</span></div>
        <p className="text-4xl font-bold font-heading text-[#003366] dark:text-blue-400" data-testid="stats-total">{total}</p>
        <p className="text-xs text-muted-foreground mt-1">seluruh jadwal tercatat</p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground"><Building2 className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Ruangan Paling Sering Dipakai</span></div>
        <div className="space-y-2">
          {topRooms.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
          {topRooms.map(([room, count]) => (
            <div key={room} data-testid={`stats-room-${room}`}>
              <div className="flex justify-between text-sm mb-0.5"><span className="font-medium truncate pr-2">{room}</span><span className="text-muted-foreground tabular-nums">{count}x</span></div>
              <div className="h-2 rounded-full bg-accent overflow-hidden"><div className="h-full bg-[#003366] dark:bg-blue-500 rounded-full" style={{ width: `${(count / maxRoom) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground"><Clock className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Jam Tersibuk</span></div>
        <div className="space-y-2">
          {busiest.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
          {busiest.map(([hour, count]) => (
            <div key={hour} data-testid={`stats-hour-${hour}`}>
              <div className="flex justify-between text-sm mb-0.5"><span className="font-medium tabular-nums">{String(hour).padStart(2, "0")}:00 - {String(hour + 1).padStart(2, "0")}:00</span><span className="text-muted-foreground tabular-nums">{count}x</span></div>
              <div className="h-2 rounded-full bg-accent overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / maxHour) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
