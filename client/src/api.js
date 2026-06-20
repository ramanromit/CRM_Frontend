// Central API base URL — driven by VITE_API_URL env variable.
// In development, set VITE_API_URL in client/.env to your machine's LAN IP
// so the app works from other devices on the same network.
// e.g. VITE_API_URL=http://192.168.31.52:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
