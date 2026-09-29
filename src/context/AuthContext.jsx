'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await authAPI.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        authAPI.logout();
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      authAPI.getProfile().then((userData) => {
        if (active) {
          setUser(userData);
          setIsAuthenticated(true);
          setLoading(false);
        }
      }).catch((error) => {
        console.error('Auth check failed:', error);
        authAPI.logout();
        if (active) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      });
    } else {
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
    }

    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authAPI.login(credentials);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authAPI.updateProfile(userData);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
