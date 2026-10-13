import { api } from './api';
import { User } from '@/types';

export const setAuthToken = (token: string, user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const u = localStorage.getItem('user');
    if (u) {
      try {
        return JSON.parse(u);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('token');
  }
  return false;
};

export const isSuperAdmin = (): boolean => {
  const user = getStoredUser();
  if (!user) return false;
  return !!user.is_superadmin || user.primary_role === 'Super Admin' || user.role === 'Super Admin';
};

export const isBaker = (): boolean => {
  const user = getStoredUser();
  if (!user) return false;
  if (isSuperAdmin()) return false;
  return user.primary_role?.toLowerCase() === 'baker' || (user.roles && user.roles.some(r => r.toLowerCase() === 'baker')) || false;
};

export const hasPermission = (permissionCode: string): boolean => {
  const user = getStoredUser();
  if (!user) return false;
  if (isSuperAdmin()) return true;
  if (user.effective_permissions && Array.isArray(user.effective_permissions)) {
    return user.effective_permissions.includes(permissionCode);
  }
  return false;
};

export const hasAnyPermission = (permissionCodes: string[]): boolean => {
  const user = getStoredUser();
  if (!user) return false;
  if (isSuperAdmin()) return true;
  if (user.effective_permissions && Array.isArray(user.effective_permissions)) {
    return permissionCodes.some(code => user.effective_permissions?.includes(code));
  }
  return false;
};

export const refreshUserProfile = async (): Promise<User | null> => {
  if (!isAuthenticated()) return null;
  try {
    const res = await api.get('/auth/me');
    if (res.data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (err) {
    console.error('Failed to refresh user profile:', err);
  }
  return null;
};

export const logout = async () => {
  if (typeof window !== 'undefined') {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  }
};
