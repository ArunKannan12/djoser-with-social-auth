import axios from "axios";
import dayjs from 'dayjs';
import {jwtDecode} from "jwt-decode";

const baseURL = "http://localhost:8000/api/";

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (req) => {
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    if (!access || !refresh) {
      return req;
    }

    try {
      const user = jwtDecode(access);
      const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 0;

      if (!isExpired) {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${access}`;
        return req;
      }

      // Access token expired, try refreshing
      const res = await axios.post(`${baseURL}auth/jwt/refresh/`, {
        refresh: refresh,
      });

      const newAccess = res.data.access;
      const newRefresh = res.data.refresh;
      console.log('New access token:', newAccess);

      // Store new access token
      localStorage.setItem("access", newAccess);
      if (newRefresh) {
        localStorage.setItem('refresh',newRefresh)
      }
      req.headers = req.headers || {};
      req.headers.Authorization = `Bearer ${newAccess}`;
      return req;

    } catch (error) {
      console.error("Token refresh failed:", error);

      try {
        // Correct logout URL
        const logoutRes = await axios.post(`${baseURL}auth/jwt/logout/`, { refresh: refresh });

        if (logoutRes.status === 200) {
          console.log('Successfully logged out');
        } else {
          console.error('Logout failed with status', logoutRes.status);
        }
      } catch (logoutError) {
        console.error("Logout failed:", logoutError);
      }

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");

      window.location.href = '/login';

      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
