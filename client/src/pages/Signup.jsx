import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import axios from 'axios';
import API_BASE_URL from '../api';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email,
        password,
        full_name: `${firstName} ${lastName}`
      });
      
      if (response.data.success) {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-content">
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message" style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '10px' }}>{error}</div>}
          <div className="form-row">
            <input 
              type="text" 
              placeholder="First name" 
              className="form-input half" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Last name" 
              className="form-input half"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input 
            type="email" 
            placeholder="Email" 
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="password-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          
          <label className="checkbox-wrapper">
            <input type="checkbox" defaultChecked />
            <span className="checkmark"></span>
            <span className="checkbox-text">I agree to the <a href="#" className="auth-link">Terms & Conditions</a></span>
          </label>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Signup;
