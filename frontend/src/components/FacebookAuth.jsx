import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {Button} from 'react-bootstrap'
import {FaFacebook} from 'react-icons/fa'

const FacebookAuth = () => {

    const navigate = useNavigate()

    useEffect(() => {
    const loadFacebookSDK = () => {
      if (document.getElementById('facebook-jssdk')) {
        initializeFacebook();
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('✅ Facebook SDK script loaded');
        initializeFacebook();
      };

      document.body.appendChild(script);
    };

    const initializeFacebook = () => {
      if (!window.FB) {
        console.error('❌ FB object not found');
        return;
      }

      try {
        window.FB.init({
          appId: '1270551067968843',
          cookie: true,
          xfbml: false,
          version: 'v18.0',
        });
        console.log('✅ FB.init finished');
      } catch (error) {
        console.error('❌ FB.init error:', error);
      }
    };

    loadFacebookSDK();
  }, []);

  const handleLogin = () => {
    if (!window.FB) {
      console.error('❌ Facebook SDK not ready');
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;

          window.FB.api('/me', { fields: 'id,name,email' }, async (user) => {
            console.log('✅ FB User:', user);

            try {
              const res = await axios.post('http://127.0.0.1:8000/api/auth/social/facebook/', {
                access_token: accessToken,
                user_id: user.id,
                email: user.email,
                name: user.name,
              });

              console.log('✅ Backend login success:', res.data);

              localStorage.setItem('access', res.data.access_token);
              localStorage.setItem('refresh', res.data.refresh_token);
              localStorage.setItem('provider', 'facebook');

              toast.success('✅ Logged in successfully!');
              navigate('/profile');
            } catch (err) {
              console.error('❌ Backend login failed:', err.response?.data || err.message);
              toast.error('❌ Backend login failed');
            }
          });
        } else {
          console.warn('❌ FB login cancelled');
          toast.warning('❌ Facebook login cancelled');
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  return (
    <Button
      variant="primary"
      onClick={handleLogin}
      className="w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
      style={{ backgroundColor: '#1877F2', borderColor: '#1877F2' }}
    >
      <FaFacebook size={20} />
      Continue with Facebook
    </Button>
  );
};

export default FacebookAuth