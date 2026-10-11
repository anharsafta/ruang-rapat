import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { EXPORT_COLUMNS, exportPDF, exportExcel } from "../lib/exporters";
import { formatTanggal, sortSchedules } from "../lib/helpers";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export default function ExportDialog({ open, onOpenChange, schedules }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cols, setCols] = useState(EXPORT_COLUMNS.map((c) => c.key));

  const toggle = (key) => setCols((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));

  const getData = () => {
    let data = sortSchedules(schedules);
    if (from) data = data.filter((s) => s.tanggal >= from);
    if (to) data = data.filter((s) => s.tanggal <= to);
    return data;
  };

  const rangeLabel = () => {
    if (from && to) return `Periode: ${formatTanggal(from)} s.d ${formatTanggal(to)}`;
    if (from) return `Mulai: ${formatTanggal(from)}`;
    if (to) return `Sampai: ${formatTanggal(to)}`;
    return "Semua Tanggal";
  };

  const doExport = (type) => {
    const data = getData();
    if (!data.length) return toast.error("Tidak ada jadwal pada rentang tanggal ini");
    if (!cols.length) return toast.error("Pilih minimal satu kolom");
    if (type === "pdf") exportPDF(data, cols, rangeLabel());
    else exportExcel(data, cols);
    toast.success(`Rekap ${type.toUpperCase()} diunduh (${data.length} jadwal)`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="export-dialog">
        <DialogHeader><DialogTitle className="font-heading">Cetak / Unduh Rekap</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dari Tanggal</Label>
              <Input type="date" data-testid="export-from" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Sampai Tanggal</Label>
              <Input type="date" data-testid="export-to" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Kolom yang Dicetak</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {EXPORT_COLUMNS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-accent">
                  <Checkbox checked={cols.includes(c.key)} onCheckedChange={() => toggle(c.key)} data-testid={`export-col-${c.key}`} />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => doExport("excel")} data-testid="export-excel-btn">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Unduh Excel
          </Button>
          <Button onClick={() => doExport("pdf")} data-testid="export-pdf-btn" className="bg-[#003366] hover:bg-[#002347] text-white">
            <FileDown className="h-4 w-4 mr-2" /> Unduh PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
