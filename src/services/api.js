import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://mock-test-platform-2scg.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// ========================
// ADD ACCESS TOKEN TO REQUESTS
// ========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

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