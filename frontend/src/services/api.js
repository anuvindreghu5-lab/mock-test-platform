import axios from "axios";

// Dev: uses package.json proxy → http://127.0.0.1:8000 (run Django first)
// Prod: set REACT_APP_API_URL or defaults to Render
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "/api"
    : "https://mock-test-platform-2scg.onrender.com/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

const isAuthRequest = (url = "") =>
  url.includes("/token/") || url.includes("/users/login/");

// ========================
// ADD ACCESS TOKEN TO REQUESTS
// ========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FormData must set its own multipart boundary (do not force application/json)
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});


// ========================
// HANDLE TOKEN EXPIRY / REFRESH
// ========================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/token/refresh/`,   // ✅ FIXED HERE
          { refresh: refreshToken }
        );

        const newAccessToken = response.data.access;

        localStorage.setItem("access_token", newAccessToken);

        api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
