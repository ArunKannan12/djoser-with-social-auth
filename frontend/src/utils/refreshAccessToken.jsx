import axios from 'axios';

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh');

  if (!refreshToken) return null;

  try {
    const response = await axios.post(
      'http://127.0.0.1:8000/api/auth/token/refresh/',
      { refresh: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const newAccessToken = response.data?.access;
    if (newAccessToken) {
      localStorage.setItem('access', newAccessToken);
      return newAccessToken;
    }
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
  }

  return null;
};