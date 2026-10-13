import axios from 'axios';

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // In production (Vercel deployment), point to the deployed Render backend
  if (process.env.NODE_ENV === 'production') {
    return 'https://bakelicious.onrender.com/api';
  }

  // If in browser and not localhost, fallback to Render backend
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://bakelicious.onrender.com/api';
  }

  // Local development default
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getBackendOrigin = (): string => {
  return API_BASE_URL.replace(/\/api\/?$/, '');
};

export const getImageUrl = (url?: string | null, fallback = '/images/cakes/chocolate-delight.svg'): string => {
  if (!url) return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/uploads') || url.startsWith('/uploads')) {
    const backendOrigin = getBackendOrigin();
    const cleanPath = url.startsWith('/api') ? url : `/api${url}`;
    return `${backendOrigin}${cleanPath}`;
  }
  if (url.startsWith('/images/cakes/') && url.endsWith('.jpg')) {
    return url.replace(/\.jpg$/, '.svg');
  }
  return url;
};

