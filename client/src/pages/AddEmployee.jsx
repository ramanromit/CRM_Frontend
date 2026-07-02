import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const AddEmployee = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    user_id: '',
    role_id: ''
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || (user.role !== 'owner' && user.role !== 'developer')) {
      return;
    }
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [usersRes, rolesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/auth/users`, { headers }),
          axios.get(`${API_BASE_URL}/api/roles/list`, { headers })
        ]);

        if (usersRes.data.success) {
          setUsers(usersRes.data.data);
        }
        if (rolesRes.data.success) {
          setRoles(rolesRes.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.user_id) {
      setError('Please select a User.');
      return;
    }
    if (!formData.role_id) {
      setError('Role is required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/employee/create`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSuccess('Employee record updated successfully!');
        setTimeout(() => {
          navigate('/employees');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const inputWrapperStyle = { flex: 1, position: 'relative' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };

  if (!user || (user.role !== 'owner' && user.role !== 'developer')) {
    return (
      <div style={{ padding: '3rem', color: '#ff6b6b', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>Only the Owner or Admin can assign employee details.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Add Employee Details</h1>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
          Assign a role to an existing user account.
        </p>

        {error && <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>⚠ {error}</div>}
        {success && <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(76,175,80,0.25)', fontSize: '14px' }}>✓ {success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading dependencies...</p>
          ) : (
            <>
              {/* Row 1: User */}
              <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={inputWrapperStyle}>
                  <label style={labelStyle}>Select User *</label>
                  <select 
                    name="user_id" 
                    className="form-input" 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={formData.user_id} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {users
                      .filter(u => u.role !== 'developer' && u.role !== 'owner')
                      .map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Role */}
              <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={inputWrapperStyle}>
                  <label style={labelStyle}>Role *</label>
                  <select 
                    name="role_id" 
                    className="form-input" 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={formData.role_id} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Choose Role --</option>
                    {roles
                      .filter(r => r.role_name !== 'owner' && r.role_name !== 'developer')
                      .map(r => (
                        <option key={r.id} value={r.id} style={{ textTransform: 'capitalize' }}>
                          {r.role_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={submitting || users.length === 0}
                style={{ 
                  marginTop: '16px',
                  opacity: (formData.user_id) ? 1 : 0.5,
                  cursor: (formData.user_id) ? 'pointer' : 'not-allowed'
                }}
              >
                {submitting ? 'Updating...' : 'Assign Role'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
