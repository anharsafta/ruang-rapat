export const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const HARI_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const SEATING_OPTIONS = ["Susunan U-Shape", "Susunan Theater", "Susunan Tanpa Kursi"];
export const RUHUI = "Ruhui Rahayu";

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isPastDate(tanggal) {
  return tanggal < todayStr();
}

// "Sen, 12 Okt 2026"
export function formatTanggal(tanggal) {
  if (!tanggal) return "-";
  const [y, m, d] = tanggal.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${HARI[dt.getDay()]}, ${d} ${BULAN[m - 1]} ${y}`;
}

export function formatTanggalFull(tanggal) {
  if (!tanggal) return "-";
  const [y, m, d] = tanggal.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${HARI_FULL[dt.getDay()]}, ${d} ${BULAN[m - 1]} ${y}`;
}

function toDate(tanggal, jam) {
  const [y, m, d] = tanggal.split("-").map(Number);
  const [hh, mm] = jam.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0);
}

// Status for display board
export function computeStatus(schedule, now = new Date()) {
  const start = toDate(schedule.tanggal, schedule.jam_mulai);
  const end = toDate(schedule.tanggal, schedule.jam_selesai);
  const diffMin = (start - now) / 60000;
  if (now >= end) return "SELESAI";
  if (now >= start && now < end) return "SEDANG BERLANGSUNG";
  if (diffMin > 0 && diffMin <= 30) return "SEGERA DIGUNAKAN";
  return "TERJADWAL";
}

export const STATUS_STYLE = {
  "SEGERA DIGUNAKAN": { dot: "#F59E0B", row: "bg-amber-950/40", text: "text-amber-300", badge: "bg-amber-500/20 text-amber-300 border border-amber-500/50", icon: "🟡", pulse: true },
  "SEDANG BERLANGSUNG": { dot: "#3B82F6", row: "bg-blue-950/40", text: "text-blue-300", badge: "bg-blue-500/20 text-blue-300 border border-blue-500/50", icon: "🔵", pulse: false },
  "SELESAI": { dot: "#E2E8F0", row: "bg-slate-800/40", text: "text-slate-300", badge: "bg-slate-500/20 text-slate-200 border border-slate-400/40", icon: "⚪", pulse: false },
  "TERJADWAL": { dot: "#EF4444", row: "bg-rose-950/40", text: "text-rose-300", badge: "bg-rose-500/20 text-rose-300 border border-rose-500/50", icon: "🔴", pulse: false },
};

export function sortSchedules(list) {
  return [...list].sort((a, b) =>
    a.tanggal === b.tanggal ? a.jam_mulai.localeCompare(b.jam_mulai) : a.tanggal.localeCompare(b.tanggal)
  );
}

// Distinct, readable accent colors per room (theme-safe: used as left border + translucent tint)
export const ROOM_PALETTE = [
  "#0D47A1", "#B45309", "#166534", "#9F1239", "#6D28D9", "#0E7490",
  "#B91C1C", "#1E40AF", "#C2410C", "#4D7C0F", "#A21CAF", "#0F766E",
  "#7C2D12", "#155E75", "#581C87", "#065F46", "#9D174D", "#3730A3",
];

function hashIdx(room) {
  let h = 0;
  for (let i = 0; i < (room || "").length; i++) h = (h * 31 + room.charCodeAt(i)) >>> 0;
  return h;
}

export function roomColor(room, rooms) {
  if (Array.isArray(rooms)) {
    const idx = rooms.indexOf(room);
    if (idx >= 0) return ROOM_PALETTE[idx % ROOM_PALETTE.length];
  }
  return ROOM_PALETTE[hashIdx(room) % ROOM_PALETTE.length];
}

export function roomChipStyle(room, rooms) {
  const c = roomColor(room, rooms);
  return { borderLeft: `3px solid ${c}`, backgroundColor: `${c}22` };
}
