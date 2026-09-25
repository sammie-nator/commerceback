import axios from "axios";

const api = axios.create({
  // Must include /api and use https in production (Vercel)
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Token still attached if present (backend ignores it while auth is off)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
