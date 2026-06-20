import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import './Auth.css';

const AddCustomer = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    company_id: '',
    relation_type: 'good'
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const headers = { Authorization: `Bearer ${token}` };

        // This endpoint fetches companies that are NOT customers (clients)
        const res = await axios.get(`${API_BASE_URL}/api/company/list`, { headers });
        if (res.data.success) {
          setClients(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.company_id) {
      setError('Please select a client to convert.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/customer/create`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSuccess('Client successfully converted to Customer!');
        setTimeout(() => {
          navigate('/customers');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to convert client');
    }
  };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Convert to Customer</h1>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
          Select a Client and set the relationship status to convert them.
        </p>

        {error && <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>⚠ {error}</div>}
        {success && <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(76,175,80,0.25)', fontSize: '14px' }}>✓ {success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading clients...</p>
          ) : clients.length === 0 ? (
            <p style={{ color: '#ffcc00' }}>No unconverted clients available.</p>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Select Client *</label>
              <select 
                name="company_id" 
                className="form-input" 
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.company_id} 
                onChange={handleChange}
                required
              >
                <option value="">-- Choose a client --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Relationship Status *</label>
            <select 
              name="relation_type" 
              className="form-input" 
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={formData.relation_type} 
              onChange={handleChange}
            >
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="bad">Bad</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || clients.length === 0}
            style={{ 
              marginTop: '8px',
              opacity: (formData.company_id) ? 1 : 0.5,
              cursor: (formData.company_id) ? 'pointer' : 'not-allowed'
            }}
          >
            Convert to Customer
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
