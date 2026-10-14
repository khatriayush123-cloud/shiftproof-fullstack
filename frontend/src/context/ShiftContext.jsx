import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { request } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const ShiftContext = createContext(null);

/** What "reset to 2026 defaults" sends back to the server. */
export const DEFAULT_PAY_SETTINGS = {
  base_rate: 26.44,
  casual_loading: 25,
  saturday_multiplier: 1.25,
  sunday_multiplier: 1.5,
  public_holiday_multiplier: 2.25,
};

/**
 * All shift, pay and fortnight data comes from the API. The server is the
 * single source of truth: hours, pay, breakdowns, the rolling window and
 * semester status are computed there and only displayed here. Nothing is
 * stored in the browser.
 */
export function ShiftProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refetch shifts and summary after any mutation.
  const refresh = useCallback(async () => {
    const [shiftData, summaryData] = await Promise.all([
      request('/api/shifts'),
      request('/api/summary'),
    ]);
    setShifts(shiftData);
    setSummary(summaryData);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setShifts([]);
      setSummary(null);
      setIsLoading(false);
      return undefined;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const [profileData, shiftData, summaryData] = await Promise.all([
          request('/api/profile'),
          request('/api/shifts'),
          request('/api/summary'),
        ]);
        if (cancelled) return;
        setProfile(profileData);
        setShifts(shiftData);
        setSummary(summaryData);
      } catch (err) {
        if (!cancelled && err.status !== 401) addToast(err.message, 'warning');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, addToast]);

  async function mutate(fn) {
    try {
      const result = await fn();
      await refresh();
      return result;
    } catch (err) {
      addToast(err.message, 'warning');
      throw err;
    }
  }

  const addShift = useCallback(
    (data) => mutate(() => request('/api/shifts', { method: 'POST', body: data })),
    [refresh, addToast],
  );

  const updateShift = useCallback(
    (id, patch) => mutate(() => request(`/api/shifts/${id}`, { method: 'PATCH', body: patch })),
    [refresh, addToast],
  );

  const deleteShift = useCallback(
    (id) => mutate(() => request(`/api/shifts/${id}`, { method: 'DELETE' })),
    [refresh, addToast],
  );

  // Dry run - does not save. Throws without toasting so the Add-shift live
  // preview can fail quietly while typing; callers decide on feedback.
  const checkShift = useCallback(
    (data) => request('/api/shifts/check', { method: 'POST', body: data }),
    [],
  );

  const saveSetup = useCallback(async (fields) => {
    const saved = await mutate(() => request('/api/profile', {
      method: 'PATCH',
      body: { ...fields, setup_complete: true },
    }));
    setProfile(saved);
    return saved;
  }, [refresh, addToast]);

  const savePaySettings = useCallback(async (fields) => {
    const saved = await mutate(() => request('/api/profile', { method: 'PATCH', body: fields }));
    setProfile(saved);
    return saved;
  }, [refresh, addToast]);

  const resetPaySettings = useCallback(
    () => savePaySettings(DEFAULT_PAY_SETTINGS),
    [savePaySettings],
  );

  const value = {
    profile,
    shifts,
    summary,
    isLoading,
    addShift,
    updateShift,
    deleteShift,
    checkShift,
    saveSetup,
    savePaySettings,
    resetPaySettings,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
