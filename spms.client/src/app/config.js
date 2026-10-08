// Single place that reads build-time settings.
// Values come from .env.development (npm run dev) or .env.production (npm run build).
// Empty VITE_API_URL = same origin as the page (when the API serves the frontend).
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
