import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Staff } from './api';

interface AuthContextValue {
  user: Staff | null; loading: boolean;
  setUser: (user: Staff | null) => void; logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Staff>('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);
  const logout = async () => { try { await api('/auth/logout', 'POST'); } finally { setUser(null); } };
  return <AuthContext.Provider value={{ user, loading, setUser, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider missing');
  return value;
}
