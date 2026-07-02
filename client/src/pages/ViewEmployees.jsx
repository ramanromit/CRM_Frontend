import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { EditIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ViewEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updating, setUpdating] = useState(false);
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
        const [empRes, rolesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/employee/list`, { headers }),
          axios.get(`${API_BASE_URL}/api/roles/list`, { headers })
        ]);

        if (empRes.data.success) {
          setEmployees(empRes.data.data);
        }
        if (rolesRes.data.success) {
          setRoles(rolesRes.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleEditClick = (emp) => {
    setEditingEmployeeId(emp.id);
    const matchedRoleObj = roles.find(r => r.role_name === emp.role);
    setEditFormData({
      name: emp.full_name || '',
      role_id: matchedRoleObj ? matchedRoleObj.id : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingEmployeeId(null);
    setEditFormData({});
  };

  const handleChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEmployee = async (emp) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/employee/update/${emp.id}`, {
        name: editFormData.name,
        role_id: editFormData.role_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const matchedRoleObj = roles.find(r => String(r.id) === String(editFormData.role_id));
        const newRoleName = matchedRoleObj ? matchedRoleObj.role_name : emp.role;
        setEmployees(employees.map(e => e.id === emp.id ? { ...e, full_name: editFormData.name, role: newRoleName } : e));
        setEditingEmployeeId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update employee details');
    } finally {
      setUpdating(false);
    }
  };

  if (!user || (user.role !== 'owner' && user.role !== 'developer')) {
    return (
      <div style={{ padding: '3rem', color: '#ff6b6b', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>Only the Owner or Admin can access employee records.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', color: 'var(--text-main)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Employees</h1>
        {user && (user.role === 'owner' || user.role === 'developer' || user.role === 'manager') && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/signup')}
              style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
            >
              + Add Employee
            </button>
            <button 
              onClick={() => navigate('/add-employee')}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              + Assign Role
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p style={{ color: '#ff6b6b' }}>{error}</p>
      ) : (
        <div>
          {employees.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No employees found.</p>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                    <th style={{ padding: '16px' }}>Code</th>
                    <th style={{ padding: '16px' }}>Full Name</th>
                    <th style={{ padding: '16px' }}>Email</th>
                    <th style={{ padding: '16px' }}>Role</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px', color: 'var(--primary)' }}>{emp.employee_code}</td>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{emp.full_name || 'N/A'}</td>
                      <td style={{ padding: '16px' }}>{emp.email}</td>
                      <td style={{ padding: '16px' }}>{emp.role}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ color: emp.is_active ? '#4caf50' : '#f44336' }}>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {user && (user.role === 'owner' || user.role === 'developer' || user.role === 'manager') ? (
                          <span 
                            onClick={() => handleEditClick(emp)}
                            title="Edit Employee"
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', opacity: 0.5, transition: 'opacity 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                            onMouseOut={(e) => e.currentTarget.style.opacity = 0.5}
                          >
                            <EditIcon size={16} />
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Floating edit panel */}
          {editingEmployeeId && (() => {
            const emp = employees.find(e => e.id === editingEmployeeId);
            if (!emp) return null;
            return (
              <div style={{
                marginTop: '1.5rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                animation: 'fadeSlideIn 0.25s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontWeight: 500, fontSize: '16px' }}>
                    Edit Employee — <span style={{ color: 'var(--primary)' }}>{emp.email}</span>
                  </h3>
                  <span 
                    onClick={handleCancelEdit}
                    style={{ cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >✕</span>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={editFormData.name} 
                      onChange={handleChange}
                      className="form-input" 
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Role</label>
                    <select 
                      name="role_id" 
                      value={editFormData.role_id} 
                      onChange={handleChange}
                      className="form-input" 
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px' }}
                    >
                      <option value="" disabled>-- Choose Role --</option>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleSaveEmployee(emp)}
                    disabled={updating}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      transition: 'background 0.2s',
                    }}
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ViewEmployees;
