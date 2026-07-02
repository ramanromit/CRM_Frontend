import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'owner' && user.role !== 'developer')) {
    return (
      <div style={{ padding: '3rem', color: '#ff6b6b', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>Only the Owner or Admin can add new employees.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@seminaagro\.com$/;
    if (!emailRegex.test(email.trim())) {
      setError('Email not found in database');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email: email.trim(),
        password: password.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`
      });
      
      if (response.data.success) {
        setSuccess('Employee account created successfully!');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setTimeout(() => {
          navigate('/employees');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperStyle = { flex: 1, position: 'relative' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => navigate('/employees')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              padding: 0, fontSize: '13px', cursor: 'pointer', marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Employees
          </button>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Add New Employee</h1>
        </div>
      </div>

      {/* Form Card */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
          Create a new user account. You can assign a role to this account afterwards.
        </p>

        {error && (
          <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(76,175,80,0.25)', fontSize: '14px' }}>
            ✓ {success}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Row 1: First Name & Last Name */}
          <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>First Name *</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Last Name *</label>
              <input 
                type="text" 
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email Address *</label>
            <input 
              type="email" 
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. employee@seminaagro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Must end with @seminaagro.com
            </div>
          </div>

          {/* Row 3: Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Password *</label>
            <div className="password-wrapper" style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Adding Employee...' : 'Add Employee'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
