import { createContext, useContext, useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rapat_token");
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.username))
      .catch(() => localStorage.removeItem("rapat_token"))
      .finally(() => setChecking(false));
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("rapat_token", res.data.token);
      setUser(res.data.username);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) };
    }
  };

  const logout = () => {
    localStorage.removeItem("rapat_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
