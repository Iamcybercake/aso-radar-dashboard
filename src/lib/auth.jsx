import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthCtx = createContext(null);

// Keeps the Supabase session in React state. `undefined` = still checking, `null` = signed out.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    api.getSession().then(setSession).catch(() => setSession(null));
    return api.onAuthChange(setSession);
  }, []);
  return <AuthCtx.Provider value={session}>{children}</AuthCtx.Provider>;
}

export const useSession = () => useContext(AuthCtx);
