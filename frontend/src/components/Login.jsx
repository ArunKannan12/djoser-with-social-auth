import React, { useState,useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import { Form, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [rememberMe,setRememberMe] = useState(false)
  const navigate = useNavigate();

    useEffect(() => {
      const accessToken = localStorage.getItem('access');

      if (accessToken) {
        try {
          const decoded = jwtDecode(accessToken)
          const currentTime = Date.now() / 1000;

           if (decoded.exp > currentTime) {
          // Token is valid (not expired)
          navigate('/profile');
        } else {
          // Token expired — optionally clear it
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          sessionStorage.removeItem('access')
          sessionStorage.removeItem('refresh')
        }
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          sessionStorage.removeItem('access')
          sessionStorage.removeItem('refresh')
        }
      }
    
    }, [navigate]);
  
    const [loginData,setLoginData] = useState({email:"",password:""});

    const {email,password} = loginData

    const handleOnChange = (e) =>{
      setLoginData({...loginData,[e.target.name]:e.target.value})
    }

    const handleSubmit = async (e) =>{
      e.preventDefault()
      setLoading(true);
      try {
        const response = await axios.post("http://localhost:8000/api/auth/jwt/create/",loginData)
        
        const {access,refresh} = response.data

        if (rememberMe) {
          
          localStorage.setItem('access',access)
          localStorage.setItem('refresh',refresh)
  
        }else{
          sessionStorage.setItem('access')
          sessionStorage.setItem('refresh')
        }

        toast.success("Login successfull")
        navigate("/profile")
      } catch (error) {
       toast.error("Invalid email or password!") 
      }finally{
        setLoading(false)
      }
    }
  return (
   <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Login</h3>
              <form onSubmit={handleSubmit} >
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
                    autoComplete='email'
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={handleOnChange}
                    placeholder="Enter your password"
                    autoComplete='current-password'
                  />
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


                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>


                <div className="text-center mt-3">
                  <p className="text-muted">
                    Don't have an account? 
                    <span 
                      className="text-primary" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => navigate('/signup')}
                    >
                      Register
                    </span>
                  </p>
                </div>
              </form>

              <div className="mt-3 text-center">
                <a href="/forgot-password" className="text-decoration-none">Forgot password?</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
//geethakannan@123