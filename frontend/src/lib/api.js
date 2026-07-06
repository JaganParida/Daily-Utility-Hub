import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const { protocol, hostname } = window.location;
  
  // If we are running locally (localhost, 127.0.0.1, or local IP address like 192.168.x.x)
  if (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    /^192\.168\./.test(hostname) || 
    /^10\./.test(hostname) || 
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Default production backend URL on Render
  return 'https://daily-utility-hub.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true // Extremely important for cookie-based session management
});

// Add a request interceptor to attach session token in Authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
