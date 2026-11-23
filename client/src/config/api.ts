// Centralized API and WebSocket configuration for RepoRelay Client

// In production on Vercel, set VITE_API_URL in the Vercel dashboard.
// Example: https://reporelay-api.onrender.com or https://reporelay-api.onrender.com/api
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';

// Strip trailing slash and trailing /api to standardize the base origin
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

// REST API root endpoint (e.g., "https://reporelay-api.onrender.com/api")
export const API_URL = `${API_BASE_URL}/api`;

// Computes the WebSocket URL dynamically based on the API origin (ws:// for http, wss:// for https)
// Or uses explicit VITE_WS_URL if set in the environment.
export const getWsUrl = (): string => {
  const explicitWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicitWsUrl) return explicitWsUrl;

  const isHttps = API_BASE_URL.startsWith('https://');
  const host = API_BASE_URL.replace(/^https?:\/\//, '');
  return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
};
