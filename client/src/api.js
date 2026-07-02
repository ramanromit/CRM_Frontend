// Central API base URL — driven by VITE_API_URL env variable.
// In development, set VITE_API_URL in client/.env to your machine's LAN IP
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const rawUrl = import.meta.env.VITE_API_URL || (isLocalhost ? `http://${window.location.hostname}:5000` : 'https://crm-proj-virid.vercel.app');
const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

export default API_BASE_URL;
