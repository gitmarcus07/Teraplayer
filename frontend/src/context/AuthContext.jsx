import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, loginApi, logoutApi, signupApi } from "../services/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  // null = checking, object = user, false = not authed
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore */
    }
    setUser(false);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginApi({ email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async ({ email, password, name }) => {
    const data = await signupApi({ email, password, name });
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user: user || null,
        isAuthed: !!user,
        loading,
        login,
        signup,
        logout,
        refresh,
        setUser,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
