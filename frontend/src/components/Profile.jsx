import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {jwtDecode} from 'jwt-decode';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('access');

    if (!accessToken) {
      navigate('/login');
      return; // stop if no token
    }

    try {
      const decoded = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
        return; // stop if token expired
      }
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      navigate('/login');
      return; // stop if token invalid
    }

    // Token valid — fetch profile
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/auth/users/me/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUser(res.data);
      } catch (error) {
        console.error('Profile fetch failed:', error.response?.data || error.message);

        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          handleLogout();
        } else {
          toast.error('Failed to load profile.');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');

    if (!refreshToken) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      toast.info('Logged out successfully');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/api/auth/jwt/logout/',
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${accessToken}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast.success('Logged out successfully from backend!');
      }
    } catch (error) {
      console.error('Logout error', error.response?.data || error.message);

      if (error.response?.status === 401) {
        toast.error('Unauthorized: Access token invalid or expired');
      } else if (error.response?.status === 400) {
        toast.warning('Refresh token already used or invalid');
      } else {
        toast.error('Server error during logout');
      }
    }

    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Your Profile</h2>

      {user ? (
        <div className="card shadow p-4">
          <p>
            <strong>First Name:</strong> {user.first_name}
          </p>
          <p>
            <strong>Last Name:</strong> {user.last_name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>

          <button className="btn btn-danger mt-3" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <p>Loading your profile...</p>
      )}
    </div>
  );
};

export default Profile;
