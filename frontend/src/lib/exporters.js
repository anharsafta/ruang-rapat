import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatTanggal } from "./helpers";

export const EXPORT_COLUMNS = [
  { key: "tanggal", label: "Tanggal" },
  { key: "ruangan", label: "Ruangan" },
  { key: "waktu", label: "Waktu" },
  { key: "pengguna", label: "Pengguna" },
  { key: "kegiatan", label: "Kegiatan/Rapat" },
  { key: "fasilitas", label: "Fasilitas" },
  { key: "petugas_pencatat", label: "Pencatat" },
];

function cellValue(s, key) {
  if (key === "tanggal") return formatTanggal(s.tanggal);
  if (key === "waktu") return `${s.jam_mulai} - ${s.jam_selesai}`;
  if (key === "fasilitas") {
    const f = [];
    if (s.zoom) f.push("Alat Zoom");
    if (s.susunan) f.push(s.susunan);
    return f.join(", ") || "-";
  }
  return s[key] || "-";
}

export function exportPDF(schedules, columns, rangeLabel) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("REKAP JADWAL RUANG RAPAT", 14, 15);
  doc.setFontSize(10);
  doc.text("Kantor Gubernur Kalimantan Timur", 14, 21);
  if (rangeLabel) doc.text(rangeLabel, 14, 27);
  const cols = EXPORT_COLUMNS.filter((c) => columns.includes(c.key));
  autoTable(doc, {
    startY: 31,
    head: [cols.map((c) => c.label)],
    body: schedules.map((s) => cols.map((c) => cellValue(s, c.key))),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [0, 51, 102] },
  });
  doc.save("rekap-jadwal-rapat.pdf");
}

export function exportExcel(schedules, columns) {
  const cols = EXPORT_COLUMNS.filter((c) => columns.includes(c.key));
  const rows = schedules.map((s) => {
    const r = {};
    cols.forEach((c) => (r[c.label] = cellValue(s, c.key)));
    return r;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal Rapat");
  XLSX.writeFile(wb, "rekap-jadwal-rapat.xlsx");
}
