import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL 
    ? (import.meta.env.VITE_BASE_URL.endsWith("/") 
        ? import.meta.env.VITE_BASE_URL 
        : `${import.meta.env.VITE_BASE_URL}/`)
    : "/api/",
});

// Request Interceptor - To add token to all requests
API.interceptors.request.use(
  (config) => {
    // Strip leading slash to avoid baseURL path replacement
    if (config.url && config.url.startsWith("/")) {
      config.url = config.url.substring(1);
    }

    const token = localStorage.getItem("admin-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - To handle expired token
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin-token");
    }

    return Promise.reject(error);
  }
);

export default API;
