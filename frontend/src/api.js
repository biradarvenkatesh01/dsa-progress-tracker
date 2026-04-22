import axios from 'axios';

const rawBaseUrl =
  process.env.REACT_APP_API_BASE_URL || 'https://dsa-tracker-backend-1gm3.onrender.com/api';
const baseURL = rawBaseUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
});

const authFreePaths = ['/auth/register/', '/auth/token/', '/auth/token/refresh/'];

api.interceptors.request.use(
  (config) => {
    const requestPath = config.url || '';
    const skipAuthHeader = authFreePaths.some((path) => requestPath.startsWith(path));

    if (skipAuthHeader) {
      return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
