import React,{useEffect,useState,useRef} from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {refreshAccessToken} from './refreshAccessToken'
import { jwtDecode } from 'jwt-decode'


const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
const MODAL_COUNTDOWN = 5 * 60 * 1000;   // 5 minutes

const useAutoLogout = () => {
const navigate = useNavigate();
  const inactivityTimerId = useRef(null);
  const expiryCheckTimerId = useRef(null);
  const countdownTimerId = useRef(null);
  const isLoggingOut = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);

  const logout = () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    clearTimeout(inactivityTimerId.current);
    clearTimeout(expiryCheckTimerId.current);
    clearTimeout(countdownTimerId.current);

    localStorage.clear();
    toast.info('Session expired due to inactivity.');
    setModalOpen(false);
    navigate('/');
  };

  const startLogoutCountdown = async () => {
    setModalOpen(true);

    const access = localStorage.getItem('access');
    let countdown = MODAL_COUNTDOWN;

    if (access) {
      try {
        const { exp } = jwtDecode(access);
        const timeUntilExpiry = exp * 1000 - Date.now();
        if (timeUntilExpiry < countdown) {
          countdown = timeUntilExpiry;
        }
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }

    countdownTimerId.current = setTimeout(() => {
      logout();
    }, countdown);
  };

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimerId.current);
    clearTimeout(countdownTimerId.current);
    setModalOpen(false);

    inactivityTimerId.current = setTimeout(() => {
      startLogoutCountdown();
    }, INACTIVITY_LIMIT);
  };

  const handleActivity = () => {
    resetInactivityTimer();
  };

  const setupTokenExpiryCheck = async () => {
    let accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');

    if (!refreshToken) return logout();

    try {
      if (!accessToken) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return logout();
      }

      const { exp } = jwtDecode(accessToken);
      const expiryTime = exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      if (timeUntilExpiry <= 0) {
        const newToken = await refreshAccessToken();
        if (!newToken) return logout();
        setupTokenExpiryCheck(); // retry
      } else {
        expiryCheckTimerId.current = setTimeout(async () => {
          const refreshed = await refreshAccessToken();
          if (!refreshed) return logout();
          setupTokenExpiryCheck();
        }, timeUntilExpiry - 1000);
      }
    } catch (err) {
      console.error('Token decode failed', err);
      logout();
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    resetInactivityTimer();
    setupTokenExpiryCheck();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(inactivityTimerId.current);
      clearTimeout(expiryCheckTimerId.current);
      clearTimeout(countdownTimerId.current);
    };
  }, []);

  return {
    modalOpen,
    onConfirm: resetInactivityTimer,
    onClose: logout,
  };
};

export default useAutoLogout