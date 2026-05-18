import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // Firebase User object | null
  const [loading, setLoading] = useState(true);   // waiting for initial auth state
  const [error,   setError]   = useState('');

  // Listen for auth state changes (handles page refresh, token expiry, etc.)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(e.message);
      }
    }
  };

  const logout = async () => {
    setError('');
    try { await signOut(auth); }
    catch (e) { setError(e.message); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook
export const useAuth = () => useContext(AuthContext);
