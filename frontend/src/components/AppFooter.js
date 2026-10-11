import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Monitor, Smartphone, Moon, Sun } from "lucide-react";

export default function AppFooter() {
  const { theme, toggleTheme, viewMode, toggleView } = useTheme();
  const navigate = useNavigate();
  return (
    <footer className="mt-8 border-t border-border bg-card/60">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          © {new Date().getFullYear()} Sistem Penjadwalan Ruang Rapat · Setda Prov. Kalimantan Timur
        </p>
        <div className="flex items-center gap-2">
          <button
            data-testid="footer-view-toggle"
            onClick={toggleView}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            {viewMode === "web" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
            {viewMode === "web" ? "Web Version" : "Mobile Version"}
          </button>
          <button
            data-testid="footer-theme-toggle"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          </button>
        </div>
      </div>
    </footer>
  );
}
