import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { request, setOnUnauthorized } from '../lib/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

/**
 * Auth state comes from the API only. The session lives in httpOnly cookies
 * the browser manages; tokens are never read, written or stored in
 * JavaScript, and nothing about auth touches localStorage.
 */
export function AuthProvider({ children }) {
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Any 401 from any request signs the user out locally; the route guards
  // then send them to /auth.
  useEffect(() => {
    setOnUnauthorized(() => setUser(null));
    return () => setOnUnauthorized(null);
  }, []);

  // Restore the session on mount. A 401 from this first call simply means
  // "not signed in" - it is not an error worth a toast.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await request('/api/auth/me');
        if (!cancelled) setUser({ name: me.profile?.full_name || me.email, email: me.email });
      } catch (err) {
        if (!cancelled && err.status !== 401) addToast(err.message, 'warning');
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [addToast]);

  const signUp = useCallback(async (full_name, email, password, consent) => {
    const data = await request('/api/auth/signup', {
      method: 'POST',
      body: { full_name, email, password, consent },
    });
    if (data.profile) {
      setUser({ name: data.profile.full_name || data.email, email: data.email });
    }
    return data; // {email, profile} or {message} when confirmation is required
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    setUser({ name: data.profile?.full_name || data.email, email: data.email });
    return data;
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // already signed out as far as this browser is concerned
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await request('/api/account', { method: 'DELETE' });
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    signUp,
    signIn,
    signOut,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
