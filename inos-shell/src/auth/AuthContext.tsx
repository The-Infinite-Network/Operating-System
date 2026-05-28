import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle as firebaseLogin, logout as firebaseLogout } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      setError(null);
      setLoading(true);
      await firebaseLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      console.error("[AuthContext] Login Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (err: any) {
      console.error("[AuthContext] Logout Failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
