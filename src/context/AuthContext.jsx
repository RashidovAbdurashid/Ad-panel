import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { loginRequest } from '../services/authService';

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'auth_token';
const STORAGE_USER_KEY = 'auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const data = await loginRequest(username, password);
      const token = data?.token || 'demo-token';
      const sessionUser = { username };
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      toast.success('Welcome back! Login successful.');
      return true;
    } catch (error) {
      toast.error(error.message || 'Invalid username or password.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    toast.info('You have been logged out.');
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
