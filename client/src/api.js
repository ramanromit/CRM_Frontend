// Central API base URL — driven by VITE_API_URL env variable.
// In production on Vercel, falls back to the deployed backend URL.
// In local dev, falls back to localhost:5000.
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = 'https://crm-proj-virid.vercel.app';
const rawUrl = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000' : BACKEND_URL);

// Strip ALL trailing slashes to prevent double-slash URLs (e.g. //api/...)
// which cause Vercel 308 redirects that fail CORS preflight checks.
const API_BASE_URL = rawUrl.replace(/\/+$/, '');

export default API_BASE_URL;
