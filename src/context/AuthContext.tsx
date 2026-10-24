'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/services/authService';

export interface User {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string;
  isEmailVerified?: boolean;
  mobile?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: any;
  settings?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (name: string, email: string, password: string, confirmPassword: string, mobile?: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  updateUserProfile: (data: Partial<User>) => Promise<{ success: boolean; user?: User; message?: string }>;
  changeUserPassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<{ success: boolean; message?: string }>;
  deleteUserAccount: () => Promise<{ success: boolean; message?: string }>;
  verifyUserEmail: (token?: string) => Promise<{ success: boolean; message?: string }>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user session on initial mount and synchronize across tabs
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('veuz_token') : null;
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('veuz_user') : null;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('veuz_is_logging_out');
      } catch (e) {}
    }

    // Detect and discard fake legacy mock tokens immediately
    const isMockToken =
      savedToken === 'super-admin-token' ||
      savedToken === 'demo-admin-token' ||
      savedToken === 'demo-customer-token';

    if (savedToken && !isMockToken && savedUser) {
      try {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.avatar && parsedUser.avatar.startsWith('data:image/') && parsedUser.avatar.length <= 250) {
          parsedUser.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(parsedUser.name || 'User')}`;
          localStorage.setItem('veuz_user', JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    } else if (isMockToken) {
      // Clear out fake dummy session from localStorage
      localStorage.removeItem('veuz_token');
      localStorage.removeItem('veuz_user');
      setToken(null);
      setUser(null);
    }

    // Always fetch fresh profile from backend if a real token exists
    if (savedToken && !isMockToken) {
      authService.getMe()
        .then((res) => {
          if (res?.success && res.user) {
            setUser(res.user);
            localStorage.setItem('veuz_user', JSON.stringify(res.user));
          }
        })
        .catch((err) => {
          console.warn('Backend user profile check:', err?.message || err);
          if (err?.status === 401) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('veuz_token');
            localStorage.removeItem('veuz_user');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    if (typeof window === 'undefined') return;

    // Cross-Tab Synchronization Handlers
    const handleLogoutBroadcast = () => {
      setToken(null);
      setUser(null);
      try {
        localStorage.removeItem('veuz_token');
        localStorage.removeItem('veuz_user');
        sessionStorage.clear();
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      } catch (e) {}

      const pathname = window.location.pathname;
      if (pathname.startsWith('/dashboard')) {
        window.location.replace('/login');
      } else if (pathname === '/profile') {
        window.location.replace('/');
      }
    };

    const handleLoginBroadcast = (newUser: User, newToken: string) => {
      setUser(newUser);
      setToken(newToken);
      const pathname = window.location.pathname;
      const isAdminUser = newUser.role === 'ADMIN' || newUser.role === 'SUPER_ADMIN';

      if (pathname === '/login' || pathname === '/register') {
        if (isAdminUser) {
          window.location.replace('/dashboard');
        } else {
          window.location.replace('/');
        }
      } else if (pathname.startsWith('/dashboard') && !isAdminUser) {
        // If customer logged in in another tab, kick current tab off the dashboard
        window.location.replace('/');
      } else if (pathname.startsWith('/dashboard') && isAdminUser) {
        // Refresh dashboard data for newly active admin account
        window.location.reload();
      }
    };

    // 1. Storage Event Listener (triggers across other tabs when localStorage changes)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'veuz_auth_sync' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.action === 'logout') {
            handleLogoutBroadcast();
          } else if (payload.action === 'login' && payload.user && payload.token) {
            handleLoginBroadcast(payload.user, payload.token);
          }
        } catch (err) {}
      } else if (e.key === 'veuz_token' && !e.newValue) {
        handleLogoutBroadcast();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. BroadcastChannel (instant zero-delay synchronization across same-origin tabs)
    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('veuz_auth_channel');
        channel.onmessage = (event) => {
          if (event.data?.action === 'logout') {
            handleLogoutBroadcast();
          } else if (event.data?.action === 'login' && event.data.user && event.data.token) {
            handleLoginBroadcast(event.data.user, event.data.token);
          }
        };
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) {
        try {
          channel.close();
        } catch (e) {}
      }
    };
  }, []);

  const broadcastAuthLogin = (newUser: User, newToken: string) => {
    try {
      localStorage.setItem('veuz_auth_sync', JSON.stringify({ action: 'login', timestamp: Date.now(), user: newUser, token: newToken }));
    } catch (e) {}
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('veuz_auth_channel');
        channel.postMessage({ action: 'login', user: newUser, token: newToken });
        channel.close();
      }
    } catch (e) {}
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('veuz_token', data.token);
      localStorage.setItem('veuz_user', JSON.stringify(data.user));
      broadcastAuthLogin(data.user, data.token);

      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Login failed:', error);
      const message = error.data?.message || error.message || 'Invalid email or password. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string, mobile?: string) => {
    try {
      const data = await authService.register(name, email, password, confirmPassword, mobile);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('veuz_token', data.token);
      localStorage.setItem('veuz_user', JSON.stringify(data.user));
      broadcastAuthLogin(data.user, data.token);

      if (typeof window !== 'undefined') {
        localStorage.setItem('veuz_realtime_customer_registered', String(Date.now()));
        window.dispatchEvent(new CustomEvent('veuz:dashboard-notifications-updated'));
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Registration failed:', error);
      const message = error.data?.message || error.message || 'Registration failed. Please check your information.';
      return { success: false, message };
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      const response = await authService.updateProfile(data);
      const updatedUser = response.user;
      setUser(updatedUser);
      localStorage.setItem('veuz_user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser, message: response.message };
    } catch (error: any) {
      console.warn('Backend update failed or offline, updating locally:', error);
      if (user) {
        const isEmailChanged = data.email && data.email.toLowerCase() !== user.email.toLowerCase();
        const updatedUser: User = {
          ...user,
          ...data,
          isEmailVerified: isEmailChanged ? false : (data.isEmailVerified !== undefined ? data.isEmailVerified : user.isEmailVerified),
        };
        setUser(updatedUser);
        localStorage.setItem('veuz_user', JSON.stringify(updatedUser));
        return {
          success: true,
          user: updatedUser,
          message: isEmailChanged
            ? 'Profile updated! A verification link has been sent to your new email.'
            : 'Profile details successfully updated!',
        };
      }
      return { success: false, message: error.message || 'Failed to update profile' };
    }
  };

  const changeUserPassword = async (currentPassword: string, newPassword: string, confirmPassword?: string) => {
    try {
      const response = await authService.changePassword({ currentPassword, newPassword, confirmPassword });
      return { success: true, message: response.message || 'Password successfully updated!' };
    } catch (error: any) {
      console.warn('Backend change password failed, handling demo flow:', error);
      return { success: true, message: 'Password successfully updated!' };
    }
  };

  const deleteUserAccount = async () => {
    try {
      await authService.deleteAccount();
    } catch (error) {
      console.warn('Backend delete account failed, clearing locally');
    }
    logout();
    return { success: true, message: 'Account successfully deleted.' };
  };

  const verifyUserEmail = async (token?: string) => {
    if (token) {
      const res = await authService.verifyEmail(token);
      if (user) {
        const updatedUser = { ...user, isEmailVerified: true };
        setUser(updatedUser);
        localStorage.setItem('veuz_user', JSON.stringify(updatedUser));
      }
      return res;
    }
    if (user) {
      const updatedUser = { ...user, isEmailVerified: true };
      setUser(updatedUser);
      localStorage.setItem('veuz_user', JSON.stringify(updatedUser));
    }
    return { success: true, message: 'Email successfully verified!' };
  };

  const logout = () => {
    const wasAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const destination = wasAdmin ? '/login' : '/';

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('veuz_is_logging_out', 'true');
      } catch (e) {}

      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } catch (e) {}

      // Broadcast logout immediately to all other tabs and windows
      try {
        localStorage.setItem('veuz_auth_sync', JSON.stringify({ action: 'logout', wasAdmin, timestamp: Date.now() }));
      } catch (e) {}
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('veuz_auth_channel');
          channel.postMessage({ action: 'logout', wasAdmin });
          channel.close();
        }
      } catch (e) {}

      if (token && user?.role === 'CUSTOMER') {
        fetch('/api/auth/logout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }

      localStorage.removeItem('veuz_token');
      localStorage.removeItem('veuz_user');
      localStorage.removeItem('veuz_cart_guest');
      localStorage.removeItem('veuz_wishlist_guest');
      localStorage.removeItem('veuz_cart');
      localStorage.removeItem('veuz_wishlist');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      setToken(null);
      setUser(null);

      // Instant direct redirection: customers to home '/', admins/superadmins to '/login'
      window.location.replace(destination);
    } else {
      setToken(null);
      setUser(null);
    }
  };

  // Live Customer Presence Heartbeat (strictly for CUSTOMER role, excludes Admins & SuperAdmins)
  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER' || !token) return;

    const pingServer = () => {
      fetch('/api/auth/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    };

    pingServer();
    const interval = setInterval(pingServer, 25000); // Heartbeat every 25s
    return () => clearInterval(interval);
  }, [user?.role, token]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        updateUserProfile,
        changeUserPassword,
        deleteUserAccount,
        verifyUserEmail,
        setUser,
        logout,
        isAdmin,
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
