import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("rapat_theme") || "light");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("rapat_view") || "web");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("rapat_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("rapat_view", viewMode);
  }, [viewMode]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const toggleView = () => setViewMode((v) => (v === "web" ? "mobile" : "web"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, viewMode, toggleView }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
