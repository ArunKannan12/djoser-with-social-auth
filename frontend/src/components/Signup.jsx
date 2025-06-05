import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

const Signup = () => {
  const navigate = useNavigate();

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
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
      }
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    re_password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.first_name) newErrors.first_name = 'First name is required';

    if (!formData.last_name) newErrors.last_name = 'Last name is required';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (!formData.re_password) newErrors.re_password = 'Confirm password is required';
    else if (formData.password !== formData.re_password) newErrors.re_password = 'Passwords do not match';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post('http://localhost:8000/api/auth/users/', formData);

      if (res.status === 201) {
        toast.success('Registration successful! Please check your email to verify.');
        setErrors({});
        navigate('/verify-email', { state: { email: formData.email } });
      }
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ api: 'Registration failed. Please try again later.' });
      }
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Sign Up</h2>
      {errors.api && <div className="alert alert-danger">{errors.api}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            name="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="mb-3">
          <label>First Name</label>
          <input
            type="text"
            name="first_name"
            className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
            value={formData.first_name}
            onChange={handleChange}
            placeholder="John"
          />
          {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
        </div>

        <div className="mb-3">
          <label>Last Name</label>
          <input
            type="text"
            name="last_name"
            className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Doe"
          />
          {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            name="password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            value={formData.password}
            onChange={handleChange}
            placeholder="********"
          />
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
        </div>

        <div className="mb-3">
          <label>Confirm Password</label>
          <input
            type="password"
            name="re_password"
            className={`form-control ${errors.re_password ? 'is-invalid' : ''}`}
            value={formData.re_password}
            onChange={handleChange}
            placeholder="********"
          />
          {errors.re_password && <div className="invalid-feedback">{errors.re_password}</div>}
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Register
        </button>

        <div className="text-center mt-3">
          <p className="text-muted">
            Already have an account?{' '}
            <span
              className="text-primary"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              Login
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
