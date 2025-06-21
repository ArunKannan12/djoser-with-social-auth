import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {FaEye,FaEyeSlash} from 'react-icons/fa'
import GoogleAuth from './GoogleAuth';
import FacebookAuth from './FacebookAuth';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const togglePassword = () =>{
    setShowPassword(prev => !prev)
  }
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const { email, password } = loginData;

  useEffect(() => {
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      try {
        const decoded = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        if (decoded.exp > currentTime) {
          navigate('/profile');
        } else {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          sessionStorage.removeItem('access');
          sessionStorage.removeItem('refresh');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        sessionStorage.removeItem('access');
        sessionStorage.removeItem('refresh');
      }
    }
  }, [navigate]);

  const handleOnChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowPassword(true);

    try {
      const response = await axios.post('http://localhost:8000/api/auth/jwt/create/', loginData);
      const { access, refresh } = response.data;

      if (rememberMe) {
        localStorage.setItem('access', access);
        localStorage.setItem('refresh', refresh);
      } else {
        sessionStorage.setItem('access', access);
        sessionStorage.setItem('refresh', refresh);
      }

      toast.success('Login successful');
      navigate('/profile');
    } catch (error) {
      toast.error('Invalid email or password!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Login</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={handleOnChange}
                    placeholder="Enter your email"
                    autoComplete="username"
                  />
                </div>

                {/* Password field with toggle */}
                <div className="mb-3 position-relative">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={handleOnChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <span
                    onClick={togglePassword}
                    style={{
                      position: 'absolute',
                      top: '38px',
                      right: '10px',
                      cursor: 'pointer',
                      color: '#6c757d',
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember Me
                  </label>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%',
                margin: '20px 0'
              }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
                <span style={{ padding: '0 10px', whiteSpace: 'nowrap', color: '#6c757d', fontWeight: 500 }}>or</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
              </div>

                    <GoogleAuth/>
                    <br />
                    <FacebookAuth/>
                <div className="text-center mt-3">
                  <p className="text-muted">
                    Don't have an account?{' '}
                    <span
                      className="text-primary"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/signup')}
                    >
                      Register
                    </span>
                  </p>
                </div>

                <div className="mt-3 text-center">
                  <a href="/forgot-password" className="text-decoration-none">Forgot password?</a>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
