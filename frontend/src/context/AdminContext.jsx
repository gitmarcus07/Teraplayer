import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminMe, adminLogin, adminLogout } from "../services/adminApi";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await adminMe();
      setAdmin(me);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async ({ email, password }) => {
    const data = await adminLogin({ email, password });
    setAdmin(data.admin);
    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } catch {
      // ignore — cookie is cleared client-side regardless
    }
    setAdmin(null);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, loading, login, logout, refresh, isAuthed: !!admin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}