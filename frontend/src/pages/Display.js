import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { isPastDate, sortSchedules, computeStatus, STATUS_STYLE, formatTanggal, fmtWaktu } from "../lib/helpers";
import { Building2 } from "lucide-react";

const MAX_DISPLAY = 10;

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return <span className="tabular-nums">{hh}.{mm}</span>;
}

function Kegiatan({ text }) {
  if (!text) return <span className="text-slate-500">-</span>;
  const long = text.length > 42;
  if (!long) return <span>{text}</span>;
  return (
    <div className="overflow-hidden max-w-full">
      <span className="marquee-track">{text}</span>
    </div>
  );
}

export default function Display() {
  const [schedules, setSchedules] = useState([]);
  const [now, setNow] = useState(new Date());

  const load = () => {
    api.get("/schedules", { params: { public: true } }).then((res) => setSchedules(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    const dataTimer = setInterval(load, 30000);
    const statusTimer = setInterval(() => setNow(new Date()), 15000);
    const reloadTimer = setInterval(() => window.location.reload(), 120000); // 2 menit
    return () => { clearInterval(dataTimer); clearInterval(statusTimer); clearInterval(reloadTimer); };
  }, []);

  const [footer1, setFooter1] = useState("SELAMAT DATANG DI KANTOR GUBERNUR KALIMANTAN TIMUR, KALTIM SUKSES MENUJU GENERASI EMAS");
  const [footer2, setFooter2] = useState("Mohon dapat menghubungi petugas terlebih dahulu untuk memastikan kesiapan perangkat Sound System sebelum pelaksanaan kegiatan. Hadi: 0823-5305-7536 atau Rifqi: 0822-5255-2136");
  useEffect(() => {
    api.get("/settings").then((res) => { setFooter1(res.data.footer1); setFooter2(res.data.footer2); }).catch(() => {});
  }, []);

  const rows = useMemo(() => sortSchedules(schedules.filter((s) => !isPastDate(s.tanggal))).slice(0, MAX_DISPLAY), [schedules]);

  return (
    <div className="h-screen w-screen bg-[#0B1120] text-slate-100 flex flex-col overflow-hidden board-grid-bg">
      {/* Header */}
      <header className="shrink-0 px-8 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center"><Building2 className="h-7 w-7 text-blue-300" /></div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading tracking-tight">Informasi Jadwal Ruang Rapat</h1>
            <p className="text-sm text-blue-300/80">Kantor Gubernur Kalimantan Timur</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl lg:text-5xl font-bold font-heading text-amber-300 leading-none"><Clock /></div>
          <div className="text-sm text-slate-400 mt-1">{formatTanggal(new Date().toISOString().slice(0, 10))}</div>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <table className="w-full table-fixed border-separate border-spacing-y-2" data-testid="display-table">
          <thead>
            <tr className="text-left text-sm uppercase tracking-wide text-slate-400">
              <th className="w-[11%] px-3 pb-2 font-semibold">Tanggal</th>
              <th className="w-[9%] px-3 pb-2 font-semibold">Waktu</th>
              <th className="w-[13%] px-3 pb-2 font-semibold">Ruang</th>
              <th className="w-[15%] px-3 pb-2 font-semibold">Pengguna</th>
              <th className="w-[38%] px-3 pb-2 font-semibold">Kegiatan / Rapat</th>
              <th className="w-[14%] px-3 pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 text-xl py-16">Tidak ada jadwal rapat.</td></tr>
            )}
            {rows.map((s) => {
              const status = computeStatus(s, now);
              const st = STATUS_STYLE[status];
              return (
                <tr key={s.id} data-testid={`display-row-${s.id}`} className={`${st.row} text-lg lg:text-xl font-semibold`}>
                  <td className={`px-3 py-3 rounded-l-xl ${st.text}`}>{formatTanggal(s.tanggal)}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-200 whitespace-nowrap">{fmtWaktu(s)}</td>
                  <td className="px-3 py-3 text-white">{s.ruangan}</td>
                  <td className="px-3 py-3 text-slate-200 truncate">{s.pengguna}</td>
                  <td className="px-3 py-3 text-slate-100"><Kegiatan text={s.kegiatan} /></td>
                  <td className="px-3 py-3 rounded-r-xl">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm lg:text-base font-medium ${st.badge} ${st.pulse ? "animate-pulse" : ""}`} data-testid={`display-status-${s.id}`}>
                      <span>{st.icon}</span> {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer 1 - running text */}
      <div className="shrink-0 bg-blue-900/40 border-t border-blue-700/40 py-2.5 overflow-hidden">
        <div className="whitespace-nowrap"><span className="marquee-fast text-lg lg:text-xl font-bold text-amber-300 uppercase tracking-wide">{footer1}</span></div>
      </div>
      {/* Footer 2 - static */}
      <div className="shrink-0 bg-[#0A1428] py-2.5 px-6 text-center">
        <p className="text-sm lg:text-base text-slate-300">{footer2}</p>
      </div>
    </div>
  );
}
