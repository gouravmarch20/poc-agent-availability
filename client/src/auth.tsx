import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_UNAUTHORIZED_EVENT } from './api';
import * as authApi from './services/auth';
import { User, AuthContextType } from './types';

const AuthContext = createContext<AuthContextType | null>(null);
const IDLE_MS = 15 * 60 * 1000;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    authApi.getCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const clearSession = () => {
      setUser(null);
      setReady(true);
    };
    window.addEventListener(API_UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(API_UNAUTHORIZED_EVENT, clearSession);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let timer: NodeJS.Timeout;
    
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await authApi.logout();
        } catch {
          /* ignore */
        }
        setUser(null);
        navigate('/login', { replace: true });
      }, IDLE_MS);
    };
    
    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    bump();
    
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, bump));
    };
  }, [user, navigate]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      ready,
      isStaff: user ? (user.role === 'superAdmin' || user.role === 'admin') : false,
      async login(email: string, password: string) {
        const data = await authApi.login({ email, password });
        setUser(data.user);
        return data.user;
      },
      async logout() {
        try {
          await authApi.logout();
        } finally {
          setUser(null);
        }
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
