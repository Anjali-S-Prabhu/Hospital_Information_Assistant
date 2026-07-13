/**
 * Axios HTTP Client Instance — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a centralized, pre-configured Axios instance that all API calls
 * in the frontend use. This avoids repeating base URL configuration and
 * ensures the JWT access token is automatically attached to every request.
 *
 * What it does:
 * - Creates an Axios instance with the base URL pointing to /api/v1.
 * - Attaches a request interceptor that reads the JWT token from localStorage
 *   and injects it as the Authorization: Bearer header.
 * - Attaches a response interceptor that detects 401 Unauthorized responses
 *   and clears the stored token + redirects to the login page.
 *
 * Inputs:
 * - JWT token stored in localStorage under the key "token".
 *
 * Outputs:
 * - A configured Axios instance exported as the default export.
 */

import axios from "axios";

// Create the Axios instance with a base URL.
// In development, Vite's proxy forwards /api to http://localhost:8000.
// In production, this resolves relative to the deployed frontend origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 *
 * Why it is written:
 * To automatically inject the JWT Bearer token into every outgoing request
 * so individual API calls do not need to manually set authorization headers.
 *
 * What it does:
 * Reads the token from localStorage and sets it as the Authorization header.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * Why it is written:
 * To handle expired or invalid tokens globally. When the backend returns
 * a 401 Unauthorized response, the frontend clears the stale token and
 * redirects the user to the login page.
 *
 * What it does:
 * Intercepts all responses. If status is 401, clears localStorage and
 * redirects to /login. Otherwise, passes the error through.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
