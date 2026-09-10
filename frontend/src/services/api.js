import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('app_token') || localStorage.getItem('app_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('app_token');
      sessionStorage.removeItem('app_user');
      localStorage.removeItem('app_token');
      localStorage.removeItem('app_user');
      localStorage.removeItem('pln_token');
      localStorage.removeItem('pln_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const reportsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
  create: async (formData) => {
    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  directReport: async (formData) => {
    const response = await api.post('/reports/direct', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  trackTicket: async (ticketId) => {
    const clean = String(ticketId || '').replace(/^#/, '').trim();
    const response = await api.get(`/reports/track/${encodeURIComponent(clean)}`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/reports/${id}/status`, { status });
    return response.data;
  },
  assignTechnician: async (id, technician) => {
    const response = await api.put(`/reports/${id}/assign`, { technician });
    return response.data;
  },
  addRepairNotes: async (id, repair_notes) => {
    const response = await api.put(`/reports/${id}/notes`, { repair_notes });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
  getDashboardStats: async (params = {}) => {
    const response = await api.get('/reports/stats/dashboard', { params });
    return response.data;
  },
  exportCSV: async (params = {}) => {
    const response = await api.get('/reports/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  exportExcel: async (params = {}) => {
    const response = await api.get('/reports/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  getExportUrl: (params = {}) => {
    const token = sessionStorage.getItem('app_token') || localStorage.getItem('app_token');
    const allParams = { ...params };
    if (token) {
      allParams.token = token;
    }
    const query = new URLSearchParams(allParams).toString();
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    return `${baseURL}/reports/export/csv${query ? `?${query}` : ''}`;
  },
  getExportExcelUrl: (params = {}) => {
    const token = sessionStorage.getItem('app_token') || localStorage.getItem('app_token');
    const allParams = { ...params };
    if (token) {
      allParams.token = token;
    }
    const query = new URLSearchParams(allParams).toString();
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    return `${baseURL}/reports/export/excel${query ? `?${query}` : ''}`;
  },
};

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const apiBase = import.meta.env.VITE_API_URL || '';
  const base = apiBase.replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
