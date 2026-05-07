import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  planName?: string;
  accessStart?: string;
  accessEnd?: string;
  usageCount: number;
  maxLimit: number;
  limitType: 'daily' | 'monthly';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isAdminAccessActivated: boolean;
  activateAdminAccess: () => void;
  resetAdminAccess: () => void;
  login: (token: string, role: string, user: User) => void;
  logout: () => void;
  isVerifying: boolean;
  accessError: string | null;
  refreshUser: () => Promise<void>;
  isNavMinimized: boolean;
  setIsNavMinimized: (minimized: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('metamatrix_token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('metamatrix_role'));
  const [isAdminAccessActivated, setIsAdminAccessActivated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isNavMinimized, setIsNavMinimized] = useState(() => localStorage.getItem('metamatrix_nav_minimized') === 'true');

  useEffect(() => {
    localStorage.setItem('metamatrix_nav_minimized', String(isNavMinimized));
  }, [isNavMinimized]);

  const resetAdminAccess = useCallback(() => {
    console.log('[Auth] Resetting admin access activation');
    setIsAdminAccessActivated(false);
  }, []);

  const activateAdminAccess = useCallback(() => {
    console.log('[Auth] Admin access activated (temporary window)');
    setIsAdminAccessActivated(true);
  }, []);

  const logout = useCallback(() => {
    console.log('[Auth] Logging out, clearing state');
    localStorage.removeItem('metamatrix_token');
    localStorage.removeItem('metamatrix_role');
    setToken(null);
    setRole(null);
    setUser(null);
    setAccessError(null);
    setIsVerifying(false);
    resetAdminAccess();
  }, [resetAdminAccess]);

  const login = (newToken: string, newRole: string, newUser: User) => {
    console.log('[Auth] Login success:', newRole);
    localStorage.setItem('metamatrix_token', newToken);
    localStorage.setItem('metamatrix_role', newRole);
    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
    setAccessError(null);
    if (newRole === 'admin') {
      resetAdminAccess(); // Success! Stabilize.
    }
  };

  // Login Timeout Monitor
  useEffect(() => {
    if (isAdminAccessActivated && role !== 'admin') {
      const timer = setTimeout(() => {
        console.warn('[Auth] Admin login timeout reached. Resetting access.');
        resetAdminAccess();
      }, 15000); // 15 seconds to login

      return () => clearTimeout(timer);
    }
  }, [isAdminAccessActivated, role, resetAdminAccess]);

  const verifyToken = useCallback(async () => {
    const currentToken = localStorage.getItem('metamatrix_token');
    if (!currentToken) {
      console.log('[Auth] No token found on init');
      setIsVerifying(false);
      return;
    }

    console.log('[Auth] Verifying token...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for token check

    try {
      const res = await fetch('/api/verify-token', {
        headers: { 'Authorization': `Bearer ${currentToken}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error('Invalid server response');
      }

      if (!res.ok) {
        console.warn('[Auth] Token verification failed:', data.error);
        if (data.status === 'pending') setAccessError('Your account is awaiting admin approval');
        else if (data.status === 'expired') setAccessError('Your access has expired');
        else if (data.status === 'blocked') setAccessError('Your account has been disabled');
        logout();
      } else {
        console.log('[Auth] Token verified successfully');
        setUser(data.user);
        setRole(data.user.role);
      }
    } catch (err: any) {
      console.error('[Auth] Verification error:', err.name === 'AbortError' ? 'Timeout' : err.message);
      if (err.name !== 'AbortError') {
        logout();
      }
    } finally {
      setIsVerifying(false);
    }
  }, [logout]);

  // Socket Connection Management
  useEffect(() => {
    if (token && user) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        socket.emit('join-admin', token);
      } else {
        socket.emit('user:online', { token });
      }

      const handleForceLogout = () => {
         logout();
         window.location.href = '/login';
      };
      
      socket.on('force-logout', handleForceLogout);
      
      return () => {
        socket.off('force-logout', handleForceLogout);
      };
    }
  }, [token, user, logout]);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('metamatrix_token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/verify-token', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const authValue = React.useMemo(() => ({ 
    user, 
    token, 
    role, 
    isAdminAccessActivated, 
    activateAdminAccess, 
    resetAdminAccess, 
    login, 
    logout, 
    isVerifying, 
    accessError, 
    refreshUser, 
    isNavMinimized, 
    setIsNavMinimized
  }), [
    user, 
    token, 
    role, 
    isAdminAccessActivated, 
    activateAdminAccess, 
    resetAdminAccess, 
    login, 
    logout, 
    isVerifying, 
    accessError, 
    refreshUser, 
    isNavMinimized, 
    setIsNavMinimized
  ]);

  return (
    <AuthContext.Provider value={authValue}>
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
