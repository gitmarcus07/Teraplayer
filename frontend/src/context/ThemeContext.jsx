import { createContext, useContext, useEffect, useState, useCallback } from "react";

const KEY = "teraplayer.theme";
const ThemeCtx = createContext(null);

function applyTheme(mode) {
  const root = document.documentElement;
  let effective = mode;
  if (mode === "system") {
    effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  if (effective === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    applyTheme(mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* noop */
    }
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mode]);

  const setTheme = useCallback((next) => setMode(next), []);

  return (
    <ThemeCtx.Provider value={{ mode, setTheme }}>{children}</ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
