import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import { fileUrl } from "./lib/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PublicJadwal from "./pages/PublicJadwal";
import Display from "./pages/Display";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();
  if (checking)
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function FaviconLoader() {
  useEffect(() => {
    api.get("/settings").then((res) => {
      if (res.data.favicon_path) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = fileUrl(res.data.favicon_path);
      }
      if (res.data.footer1) document.title = "Jadwal Ruang Rapat - Setda Kaltim";
    });
  }, []);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <FaviconLoader />
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/jadwal" element={<PublicJadwal />} />
            <Route path="/display" element={<Display />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/setting" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
