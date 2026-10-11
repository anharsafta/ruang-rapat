import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, fileUrl } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { CalendarDays, Monitor, LogIn, Building2 } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    api.get("/settings").then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Login berhasil");
      navigate("/dashboard");
    } else {
      toast.error(res.error || "Login gagal");
    }
  };

  const bgStyle = settings?.login_bg_path
    ? { backgroundImage: `url(${fileUrl(settings.login_bg_path)})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};
  const darkness = settings?.login_bg_darkness ?? 40;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-100" style={bgStyle}>
      {settings?.login_bg_path && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${darkness / 100})` }} />
      )}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#003366] text-white mb-3 shadow-lg">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className={`text-2xl font-bold font-heading ${settings?.login_bg_path ? "text-white" : "text-[#003366]"}`}>
            Sistem Penjadwalan Ruang Rapat
          </h1>
          <p className={`text-sm ${settings?.login_bg_path ? "text-slate-200" : "text-slate-500"}`}>
            Kantor Gubernur Kalimantan Timur
          </p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
          <div>
            <Label htmlFor="username" className="text-slate-700">Username</Label>
            <Input
              id="username" data-testid="login-username-input"
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username" className="mt-1" autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-slate-700">Password</Label>
            <Input
              id="password" type="password" data-testid="login-password-input"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password" className="mt-1" autoComplete="current-password"
            />
          </div>
          <Button type="submit" data-testid="login-submit-button" disabled={loading}
            className="w-full bg-[#003366] hover:bg-[#002347] text-white h-11">
            <LogIn className="h-4 w-4 mr-2" />
            {loading ? "Memproses..." : "Masuk"}
          </Button>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button type="button" data-testid="link-public-jadwal" onClick={() => navigate("/jadwal")}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#003366] hover:underline">
              <CalendarDays className="h-4 w-4" /> Buka Halaman Jadwal Ruang Rapat
            </button>
            <button type="button" data-testid="link-display" onClick={() => navigate("/display")}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#003366] hover:underline">
              <Monitor className="h-4 w-4" /> Display Ruang Rapat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
