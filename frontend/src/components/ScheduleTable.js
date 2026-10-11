import { fileUrl } from "../lib/api";
import { formatTanggal } from "../lib/helpers";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Pencil, Trash2, FileText, Video, Armchair, Eye, AlertTriangle } from "lucide-react";

function Fasilitas({ s }) {
  const items = [];
  if (s.zoom) items.push(<Badge key="z" variant="secondary" className="gap-1"><Video className="h-3 w-3" /> Zoom</Badge>);
  if (s.susunan) items.push(<Badge key="s" variant="secondary" className="gap-1"><Armchair className="h-3 w-3" /> {s.susunan.replace("Susunan ", "")}</Badge>);
  if (!items.length) return <span className="text-muted-foreground text-xs">-</span>;
  return <div className="flex flex-wrap gap-1">{items}</div>;
}

export default function ScheduleTable({ schedules, isAdmin, onEdit, onDelete, showPetugas = true, showSurat = true }) {
  const colCount = 6 + (showPetugas ? 1 : 0) + (showSurat ? 1 : 0) + (isAdmin ? 1 : 0);
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table data-testid="schedule-table">
          <TableHeader>
            <TableRow className="bg-[#003366] hover:bg-[#003366]">
              <TableHead className="text-white font-semibold">Tanggal</TableHead>
              <TableHead className="text-white font-semibold">Ruangan</TableHead>
              <TableHead className="text-white font-semibold">Waktu</TableHead>
              <TableHead className="text-white font-semibold">Pengguna</TableHead>
              <TableHead className="text-white font-semibold">Kegiatan/Rapat</TableHead>
              <TableHead className="text-white font-semibold">Fasilitas</TableHead>
              {showPetugas && <TableHead className="text-white font-semibold">Pencatat</TableHead>}
              {showSurat && <TableHead className="text-white font-semibold">Surat</TableHead>}
              {isAdmin && <TableHead className="text-white font-semibold text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 && (
              <TableRow><TableCell colSpan={colCount} className="text-center py-10 text-muted-foreground">Belum ada jadwal.</TableCell></TableRow>
            )}
            {schedules.map((s) => (
              <TableRow key={s.id} data-testid={`schedule-row-${s.id}`} className="hover:bg-accent/40">
                <TableCell className="font-medium whitespace-nowrap">{formatTanggal(s.tanggal)}</TableCell>
                <TableCell className="whitespace-nowrap font-medium text-[#003366] dark:text-blue-400">{s.ruangan}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{s.jam_mulai} - {s.jam_selesai}</TableCell>
                <TableCell className="max-w-[180px]">{s.pengguna}</TableCell>
                <TableCell className="max-w-[260px]">{s.kegiatan}</TableCell>
                <TableCell><Fasilitas s={s} /></TableCell>
                {showPetugas && <TableCell className="whitespace-nowrap">{s.petugas_pencatat || "-"}</TableCell>}
                {showSurat && (
                <TableCell>
                  {s.surat_files && s.surat_files.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {s.surat_files.map((f, i) => (
                        <a key={f.id} href={fileUrl(f.storage_path)} target="_blank" rel="noreferrer"
                          data-testid={`view-surat-${s.id}-${i}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          {f.content_type === "application/pdf" ? <FileText className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          Lihat surat {s.surat_files.length > 1 ? i + 1 : ""}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-100 gap-1" data-testid={`badge-no-surat-${s.id}`}>
                      <AlertTriangle className="h-3 w-3" /> Belum ada surat
                    </Badge>
                  )}
                </TableCell>
                )}
                {isAdmin && (
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(s)} data-testid={`edit-${s.id}`}>
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(s)} data-testid={`delete-${s.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
