// /**
//  * API service for communicating with the backend.
//  * Handles all HTTP requests and authentication.
//  */

// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8000';

// // Create axios instance with default config
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests if available
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Handle response errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Token expired or invalid
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// // ============================================
// // Authentication
// // ============================================

// export const authAPI = {
//   login: (credentials) => api.post('/auth/login', credentials),
//   register: (data) => api.post('/auth/register', data),
//   verifyToken: () => api.post('/auth/verify'),
// };

// // ============================================
// // Users
// // ============================================

// export const usersAPI = {
//   getCurrentUser: () => api.get('/users/me'),
//   getGroupUsers: () => api.get('/users'),
//   getUser: (userId) => api.get(`/users/${userId}`),
// };

// // ============================================
// // Reservations
// // ============================================

// export const reservationsAPI = {
//   create: (data) => api.post('/reservations', data),
//   getAll: (params) => api.get('/reservations', { params }),
//   getById: (id) => api.get(`/reservations/${id}`),
//   update: (id, data) => api.put(`/reservations/${id}`, data),
//   delete: (id) => api.delete(`/reservations/${id}`),
// };

// // ============================================
// // Fuel Logs
// // ============================================

// export const fuelLogsAPI = {
//   create: (data) => api.post('/fuel-logs', data),
//   getAll: (params) => api.get('/fuel-logs', { params }),
//   getMySummary: () => api.get('/fuel-logs/my-summary'),
//   getUserSummary: (userId) => api.get(`/fuel-logs/summary/${userId}`),
// };

// // ============================================
// // Rules
// // ============================================

// export const rulesAPI = {
//   create: (data) => api.post('/rules', data),
//   getAll: () => api.get('/rules'),
//   getActive: () => api.get('/rules/active'),
//   update: (id, data) => api.put(`/rules/${id}`, data),
//   delete: (id) => api.delete(`/rules/${id}`),
// };

// export default api;

/**
 * API service for communicating with the backend.
 * Handles all HTTP requests and authentication.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===============================
// Request interceptor – add token
// ===============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================================
// Response interceptor – handle 401
// ==================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data ONLY
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // ❗ אל תעשה redirect כאן
      // AuthContext / Router יטפלו בזה
      console.warn('Unauthorized – token removed');
    }

    return Promise.reject(error);
  }
);

// ============================================
// Authentication
// ============================================

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  verifyToken: () => api.post('/auth/verify'),
};

// ============================================
// Users
// ============================================

export const usersAPI = {
  getCurrentUser: () => api.get('/users/me'),
  getGroupUsers: () => api.get('/users'),
  getUser: (userId) => api.get(`/users/${userId}`),
};

// ============================================
// Reservations
// ============================================

export const reservationsAPI = {
  create: (data) => api.post('/reservations', data),
  getAll: (params) => api.get('/reservations', { params }),
  getById: (id) => api.get(`/reservations/${id}`),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  delete: (id) => api.delete(`/reservations/${id}`),
};

// ============================================
// Fuel Logs
// ============================================

export const fuelLogsAPI = {
  create: (data) => api.post('/fuel-logs', data),
  getAll: (params) => api.get('/fuel-logs', { params }),
  getMySummary: () => api.get('/fuel-logs/my-summary'),
  getUserSummary: (userId) => api.get(`/fuel-logs/summary/${userId}`),
};

// ============================================
// Rules
// ============================================

export const rulesAPI = {
  create: (data) => api.post('/rules', data),
  getAll: () => api.get('/rules'),
  getActive: () => api.get('/rules/active'),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id) => api.delete(`/rules/${id}`),
};

export default api;

