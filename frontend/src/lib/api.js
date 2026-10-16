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
  
  // In production on Vercel:
  // If backend is deployed on same domain or proxied via vercel.json rewrites, /api avoids CORS and cookie issues
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Extremely important for cookie-based session management
  timeout: 30000 // 30s timeout to prevent hanging on cold starts
});


export default api;
