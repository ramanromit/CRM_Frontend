import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s-]{10,}$/;

const AddCompany = () => {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const canAssign = ['developer', 'owner', 'manager'].includes(role);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    phone: '',
    email: '',
    source: '',
    referrerName: '',
    priority: 'low',
    website: '',
    address: '',
    owner_id: ''
  });

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/api/employee/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setEmployees(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };
    fetchEmployees();
  }, []);

  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Company name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return '';
        if (!emailRegex.test(value)) return 'Enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return '';
        if (!phoneRegex.test(value)) return 'Enter a valid phone (min 10 digits)';
        return '';
      case 'website':
        if (value && !/^https?:\/\/.+/.test(value) && value.trim()) return 'Start with http:// or https://';
        return '';
      default:
        return '';
    }
  };

  const getFieldStatus = (name) => {
    if (!touched[name]) return 'idle';
    const err = validate(name, formData[name]);
    return err ? 'error' : 'valid';
  };

  const getFieldError = (name) => {
    if (!touched[name]) return '';
    return validate(name, formData[name]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTouched({ ...touched, [name]: true });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handlePriorityChange = (priority) => {
    setFormData({ ...formData, priority });
  };

  const isFormValid = () => {
    const hasName = formData.name.trim().length >= 2;
    const hasSource = formData.source !== '' && (formData.source !== 'Referral' || formData.referrerName !== '');
    const hasSize = formData.size !== '';
    const isEmailValid = formData.email.trim() === '' || emailRegex.test(formData.email);
    const isPhoneValid = formData.phone.trim() === '' || phoneRegex.test(formData.phone);
    return hasName && hasSource && hasSize && isEmailValid && isPhoneValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setTouched({ name: true, email: true, phone: true, source: true, size: true, referrerName: true });

    if (!isFormValid()) {
      setError('Please fix the errors above before submitting.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const submitData = { ...formData };
      if (submitData.source === 'Referral' && submitData.referrerName) {
        submitData.source = `referral("${submitData.referrerName}")`;
      }
      delete submitData.referrerName;
      if (!canAssign) {
        delete submitData.owner_id; // Let backend default to creator
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/company/create`,
        submitData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Company added successfully!');
        setTimeout(() => navigate('/clients'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperStyle = { flex: 1, position: 'relative' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };

  const getInputBorder = (name) => {
    const status = getFieldStatus(name);
    if (status === 'valid') return '1px solid #4caf50';
    if (status === 'error') return '1px solid #f44336';
    return '1px solid var(--border-color)';
  };

  const feedbackStyle = (name) => ({
    fontSize: '12px',
    marginTop: '6px',
    minHeight: '18px',
    color: getFieldStatus(name) === 'error' ? '#f44336' : '#4caf50',
    transition: 'all 0.3s ease',
  });

  const statusIcon = (name) => {
    const status = getFieldStatus(name);
    if (status === 'valid') return <span style={{ position: 'absolute', right: '14px', top: '42px', color: '#4caf50', fontSize: '16px', pointerEvents: 'none' }}>✓</span>;
    if (status === 'error') return <span style={{ position: 'absolute', right: '14px', top: '42px', color: '#f44336', fontSize: '16px', pointerEvents: 'none' }}>✗</span>;
    return null;
  };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Add New Company</h1>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>
              ⚠ {error}
            </div>
          )}
          {success && (
            <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(76,175,80,0.25)', fontSize: '14px' }}>
              ✓ {success}
            </div>
          )}

          {/* Row 1: Name & Email */}
          <div className="form-row">
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Company Name *</label>
              {statusIcon('name')}
              <input type="text" name="name" className="form-input" style={{ border: getInputBorder('name') }} value={formData.name} onChange={handleChange} onBlur={handleBlur} />
              <div style={feedbackStyle('name')}>{getFieldError('name') || (getFieldStatus('name') === 'valid' ? 'Looks good!' : '')}</div>
            </div>
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Email</label>
              {statusIcon('email')}
              <input type="text" name="email" className="form-input" style={{ border: getInputBorder('email') }} value={formData.email} onChange={handleChange} onBlur={handleBlur} />
              <div style={feedbackStyle('email')}>{getFieldError('email') || (getFieldStatus('email') === 'valid' ? 'Valid email ✓' : '')}</div>
            </div>
          </div>

          {/* Row 2: Phone & Domain */}
          <div className="form-row">
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Phone</label>
              {statusIcon('phone')}
              <input type="text" name="phone" className="form-input" style={{ border: getInputBorder('phone') }} value={formData.phone} onChange={handleChange} onBlur={handleBlur} />
              <div style={feedbackStyle('phone')}>{getFieldError('phone') || (getFieldStatus('phone') === 'valid' ? 'Valid phone ✓' : '')}</div>
            </div>
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Domain</label>
              <select name="domain" className="form-input" value={formData.domain} onChange={handleChange} style={{ cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                <option value="" disabled style={{ background: 'var(--bg-input)', color: '#999' }}>-- Select Domain --</option>
                <option value="Field Service" style={{ background: 'var(--bg-input)' }}>Field Service</option>
                <option value="Product" style={{ background: 'var(--bg-input)' }}>Product</option>
                <option value="Others" style={{ background: 'var(--bg-input)' }}>Others</option>
              </select>
            </div>
          </div>

          {/* Row 3: Industry & Size */}
          <div className="form-row">
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Industry</label>
              <select name="industry" className="form-input" value={formData.industry} onChange={handleChange} style={{ cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                <option value="" disabled style={{ background: 'var(--bg-input)', color: '#999' }}>-- Select Industry --</option>
                <option value="Individual Farmers" style={{ background: 'var(--bg-input)' }}>Individual Farmers</option>
                <option value="Farmer Producer Organizations (FPOs)" style={{ background: 'var(--bg-input)' }}>Farmer Producer Organizations (FPOs)</option>
                <option value="Community-Based Organizations (CBOs)" style={{ background: 'var(--bg-input)' }}>Community-Based Organizations (CBOs)</option>
                <option value="Institutional Clients" style={{ background: 'var(--bg-input)' }}>Institutional Clients</option>
                <option value="Agri-Business Partners" style={{ background: 'var(--bg-input)' }}>Agri-Business Partners</option>
                <option value="Educational/Research Institutes" style={{ background: 'var(--bg-input)' }}>Educational/Research Institutes</option>
                <option value="Others" style={{ background: 'var(--bg-input)' }}>Others</option>
              </select>
            </div>
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Size *</label>
              <select name="size" className="form-input" value={formData.size} onChange={handleChange} onBlur={handleBlur} style={{ cursor: 'pointer', border: touched.size && !formData.size ? '1px solid #f44336' : formData.size ? '1px solid #4caf50' : '1px solid var(--border-color)' }}>
                <option value="" disabled style={{ background: 'var(--bg-input)', color: '#999' }}>-- Select Size --</option>
                <option value="startup" style={{ background: 'var(--bg-input)' }}>Startup</option>
                <option value="enterprise" style={{ background: 'var(--bg-input)' }}>Enterprise</option>
                <option value="global enterprise" style={{ background: 'var(--bg-input)' }}>Global Enterprise</option>
                <option value="others" style={{ background: 'var(--bg-input)' }}>Others</option>
              </select>
              {touched.size && !formData.size && <div style={{ fontSize: '12px', marginTop: '6px', color: '#f44336' }}>Please select a size</div>}
            </div>
          </div>

          {/* Row 4: Source & Website */}
          <div className="form-row">
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Source *</label>
              <select name="source" className="form-input" value={formData.source} onChange={handleChange} onBlur={handleBlur} style={{ cursor: 'pointer', border: touched.source && !formData.source ? '1px solid #f44336' : formData.source ? '1px solid #4caf50' : '1px solid var(--border-color)' }}>
                <option value="" disabled style={{ background: 'var(--bg-input)', color: '#999' }}>-- Select Source --</option>
                <option value="Phone Outreach" style={{ background: 'var(--bg-input)' }}>Phone Outreach</option>
                <option value="Website" style={{ background: 'var(--bg-input)' }}>Website</option>
                <option value="Email Campaign" style={{ background: 'var(--bg-input)' }}>Email Campaign</option>
                <option value="Advertisement" style={{ background: 'var(--bg-input)' }}>Advertisement</option>
                <option value="Networking" style={{ background: 'var(--bg-input)' }}>Networking</option>
                <option value="Social Media" style={{ background: 'var(--bg-input)' }}>Social Media</option>
                <option value="Referral" style={{ background: 'var(--bg-input)' }}>Referral</option>
                <option value="LinkedIn" style={{ background: 'var(--bg-input)' }}>LinkedIn</option>
                <option value="Others" style={{ background: 'var(--bg-input)' }}>Others</option>
              </select>
              {touched.source && !formData.source && <div style={{ fontSize: '12px', marginTop: '6px', color: '#f44336' }}>Please select a source</div>}
            </div>
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Website</label>
              {statusIcon('website')}
              <input type="text" name="website" className="form-input" style={{ border: getInputBorder('website') }} placeholder="https://example.com" value={formData.website} onChange={handleChange} onBlur={handleBlur} />
              <div style={feedbackStyle('website')}>{getFieldError('website')}</div>
            </div>
          </div>

          {formData.source === 'Referral' && (
            <div className="form-row">
              <div style={inputWrapperStyle}>
                <label style={labelStyle}>Referrer Name *</label>
                <select name="referrerName" className="form-input" value={formData.referrerName} onChange={handleChange} onBlur={handleBlur} style={{ cursor: 'pointer', border: touched.referrerName && !formData.referrerName ? '1px solid #f44336' : formData.referrerName ? '1px solid #4caf50' : '1px solid var(--border-color)' }}>
                  <option value="" disabled style={{ background: 'var(--bg-input)', color: '#999' }}>-- Select Referrer --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.full_name} style={{ background: 'var(--bg-input)' }}>{emp.full_name}</option>
                  ))}
                </select>
                {touched.referrerName && !formData.referrerName && <div style={{ fontSize: '12px', marginTop: '6px', color: '#f44336' }}>Please select a referrer</div>}
              </div>
              <div style={inputWrapperStyle}></div>
            </div>
          )}

          {/* Priority */}
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['low', 'medium', 'high'].map(level => {
                let color = '';
                if (level === 'low') color = '#4caf50';
                if (level === 'medium') color = '#ffeb3b';
                if (level === 'high') color = '#f44336';
                const isActive = formData.priority === level;
                const displayLabel = level.charAt(0).toUpperCase() + level.slice(1);

                return (
                  <button
                    type="button"
                    key={level}
                    onClick={() => handlePriorityChange(level)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${isActive ? color : 'transparent'}`,
                      backgroundColor: isActive ? `${color}22` : 'var(--bg-input)',
                      color: isActive ? color : 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? `0 4px 12px ${color}33` : 'none',
                      transform: isActive ? 'translateY(-2px)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = `${color}1A`;
                        e.currentTarget.style.color = color;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-input)';
                        e.currentTarget.style.color = 'var(--text-main)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    <span style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      backgroundColor: isActive ? color : 'var(--border-color)',
                      border: `2px solid ${color}`,
                      display: 'inline-block',
                      transition: 'all 0.3s ease'
                    }} />
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address */}
          <div style={{ marginTop: '8px' }}>
            <label style={labelStyle}>Address</label>
            <textarea
              name="address"
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {canAssign && (
            <div style={{ marginTop: '8px' }}>
              <label style={labelStyle}>Assign To (Optional)</label>
              <select name="owner_id" className="form-input" value={formData.owner_id} onChange={handleChange} style={{ cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                <option value="" style={{ background: 'var(--bg-input)', color: '#999' }}>-- Assign to self --</option>
                {employees
                  .filter(emp => role !== 'manager' || (emp.role !== 'manager' && emp.role !== 'owner' && emp.role !== 'developer'))
                  .map(emp => (
                    <option key={emp.id} value={emp.id} style={{ background: 'var(--bg-input)' }}>{emp.full_name || emp.email}</option>
                  ))
                }
              </select>
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !isFormValid()}
            style={{
              marginTop: '16px',
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Adding...' : 'Add Company'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCompany;
