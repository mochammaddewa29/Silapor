import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Bersihkan sisa localStorage lama agar tidak tersimpan permanen
  useEffect(() => {
    localStorage.removeItem('app_token');
    localStorage.removeItem('app_user');
    localStorage.removeItem('pln_token');
    localStorage.removeItem('pln_user');
  }, []);

  // Gunakan sessionStorage: saat browser ditutup & dibuka kembali, sesi langsung kembali ke awal (tidak login)
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('app_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = sessionStorage.getItem('app_token');
      if (storedToken) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          sessionStorage.setItem('app_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to verify token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    setToken(data.token);
    setUser(data.user);
    sessionStorage.setItem('app_token', data.token);
    sessionStorage.setItem('app_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    setToken(data.token);
    setUser(data.user);
    sessionStorage.setItem('app_token', data.token);
    sessionStorage.setItem('app_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('app_token');
    sessionStorage.removeItem('app_user');
    localStorage.removeItem('app_token');
    localStorage.removeItem('app_user');
    localStorage.removeItem('pln_token');
    localStorage.removeItem('pln_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
