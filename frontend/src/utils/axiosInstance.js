import axios from "axios";
import { BASE_URL } from "./apiPath";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 🔐 Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🛑 Handle unauthorized
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("token"); // ✅ Clear token on 401
        window.location.href = "/login";
      } else if (error.response.status === 500) {
        console.error("Server error. Please try again later");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    } else {
      console.error("Network or CORS error:", error.message); // ✅ Log other errors
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
