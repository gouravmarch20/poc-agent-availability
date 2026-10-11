import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_UNAUTHORIZED_EVENT } from './api';
import * as authApi from './services/auth';
import { User, AuthContextType } from './types';
import { notifyError, notifySuccess } from './lib/notify';

const AuthContext = createContext<AuthContextType | null>(null);
const IDLE_MS = 15 * 60 * 1000;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const navigate = useNavigate();
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    authApi.getCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const clearSession = () => {
      if (userRef.current) notifyError('Your session has expired', { description: 'Please sign in again to continue.', id: 'session-expired' });
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
        notifyError('Signed out due to inactivity', { description: 'Please sign in again.', id: 'session-idle' });
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
          notifySuccess("You've been logged out", {
            description: import.meta.env.VITE_DEMO_MODE === 'true' ? 'Pick another role to keep exploring.' : 'See you again soon.',
            id: 'logout-success',
          });
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
