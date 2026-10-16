import axios from 'axios';

const getBaseURL = () => {
  const { protocol, hostname } = window.location;

  // 1. Local development (localhost, 127.0.0.1, or local LAN IP)
  if (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    /^192\.168\./.test(hostname) || 
    /^10\./.test(hostname) || 
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    return `${protocol}//${hostname}:5000/api`;
  }

  // 2. Production on Vercel:
  // Both frontend and backend are deployed together on Vercel.
  // We use relative '/api' on the exact same domain to prevent all CORS and cookie issues.
  // We explicitly ignore any obsolete or stale 'onrender.com' environment variables.
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('onrender.com') && !hostname.includes('vercel.app')) {
    return envUrl.replace(/\/+$/, '');
  }

  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Extremely important for cookie-based session management
  timeout: 30000 // 30s timeout to prevent hanging on cold starts
});


export default api;
