import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPopup({ open, message = "Perubahan Berhasil", onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      data-testid="success-popup"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-10 py-8 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <p className="text-xl font-bold font-heading text-foreground">{message}</p>
      </div>
    </div>
  );
}
