import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const AddAssignment = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  
  const [assignMode, setAssignMode] = useState('self'); // 'self', 'owner', 'custom'
  const [assignedTo, setAssignedTo] = useState('');

  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  const isManager = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'developer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch companies
        const compRes = await axios.get(`${API_BASE_URL}/api/company/all`, { headers });
        if (compRes.data.success) setCompanies(compRes.data.data);

        // Fetch employees list
        if (isManager) {
          const empRes = await axios.get(`${API_BASE_URL}/api/employee/list`, { headers });
          if (empRes.data.success) setEmployees(empRes.data.data);
        }
      } catch (err) {
        setError('Failed to load form data');
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchData();
  }, [navigate, isManager]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync assignedTo based on mode
  useEffect(() => {
    if (assignMode === 'self') {
      setAssignedTo(user?.id || '');
    } else if (assignMode === 'owner' && selectedCompany) {
      setAssignedTo(selectedCompany.owner_id || '');
    } else if (assignMode === 'custom' && !isManager) {
      setAssignedTo(user?.id || '');
    }
  }, [assignMode, selectedCompany, user, isManager]);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company) => {
    if (selectedCompany?.id === company.id) {
      setSelectedCompany(null);
      setAssignMode('self');
      setAssignedTo(user?.id || '');
    } else {
      setSelectedCompany(company);
      if (assignMode === 'owner') {
        setAssignedTo(company.owner_id || '');
      }
    }
    setDropdownOpen(false);
    setSearchTerm('');
  };

  const isFormValid = () => {
    if (!title.trim()) return false;
    if (!selectedCompany) return false; // Enforce selecting a company
    if (!assignedTo) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTouched({ title: true, company: true });

    if (!selectedCompany) {
      setError('Please select a company for this task.');
      return;
    }
    if (!isFormValid()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        title: title.trim(),
        description: description || null,
        assigned_to: assignedTo,
        company_id: selectedCompany.id,
        priority,
        due_date: dueDate || null
      };

      const res = await axios.post(`${API_BASE_URL}/api/task/create`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSuccess('Task assigned successfully!');
        setTitle('');
        setDescription('');
        setSelectedCompany(null);
        setDueDate('');
        setAssignMode('self');
        setTimeout(() => navigate('/assignments'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };
  const inputWrapperStyle = { flex: 1, position: 'relative' };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => navigate('/assignments')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              padding: 0, fontSize: '13px', cursor: 'pointer', marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Assignments
          </button>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Assign New Task</h1>
        </div>
      </div>

      {/* Form Card */}
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

          {/* Company Selector */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <label style={labelStyle}>Select Company / Client *</label>
            <div
              id="company-selector"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: selectedCompany ? '1px solid #4caf50' : '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '14px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={{ color: selectedCompany ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {selectedCompany ? selectedCompany.name : '-- Choose a Company --'}
              </span>
              <span style={{ fontSize: '12px', transition: 'transform 0.3s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
            </div>
            {selectedCompany && (
              <div style={{ fontSize: '12px', marginTop: '6px', color: '#4caf50' }}>
                ✓ {selectedCompany.name} — {selectedCompany.industry || 'N/A'} · {selectedCompany.client_type === 'customer' ? 'Customer' : 'Client'}
              </div>
            )}

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginTop: '6px',
                maxHeight: '260px',
                overflowY: 'auto',
                boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
                animation: 'fadeSlideIn 0.2s ease',
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                </div>

                {companiesLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading companies...</div>
                ) : filteredCompanies.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No companies found</div>
                ) : (
                  filteredCompanies.map((company) => {
                    const isChecked = selectedCompany?.id === company.id;
                    return (
                      <div
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          backgroundColor: isChecked ? 'rgba(76,175,80,0.12)' : 'transparent',
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                        onMouseOut={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: isChecked ? '2px solid #4caf50' : '2px solid var(--border-color)',
                          backgroundColor: isChecked ? '#4caf50' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                        }}>
                          {isChecked && <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                            {company.name} <span style={{ fontSize: '11px', padding: '2px 6px', background: company.client_type === 'customer' ? '#e3f2fd' : '#f5f5f5', color: company.client_type === 'customer' ? '#1976d2' : '#757575', borderRadius: '4px', marginLeft: '6px' }}>{company.client_type}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {company.industry || 'No industry'} · {company.domain || 'No domain'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Task Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Verify seed delivery dispatch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Description (Optional)</label>
            <textarea
              className="form-input"
              placeholder="Describe the task instructions..."
              style={{ minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Assign To */}
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Assign To *</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setAssignMode('self')}
                style={{
                  padding: '10px 16px', borderRadius: '8px',
                  border: assignMode === 'self' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: assignMode === 'self' ? 'rgba(92, 184, 92, 0.15)' : 'var(--bg-input)',
                  color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                👤 Delegate to Myself
              </button>

              {selectedCompany?.owner_id && (
                <button
                  type="button"
                  onClick={() => setAssignMode('owner')}
                  style={{
                    padding: '10px 16px', borderRadius: '8px',
                    border: assignMode === 'owner' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: assignMode === 'owner' ? 'rgba(92, 184, 92, 0.15)' : 'var(--bg-input)',
                    color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                    transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  💼 Client Owner ({selectedCompany.owner_name})
                </button>
              )}

              {isManager && (
                <button
                  type="button"
                  onClick={() => setAssignMode('custom')}
                  style={{
                    padding: '10px 16px', borderRadius: '8px',
                    border: assignMode === 'custom' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: assignMode === 'custom' ? 'rgba(92, 184, 92, 0.15)' : 'var(--bg-input)',
                    color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                    transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  👥 Select another employee
                </button>
              )}
            </div>

            {assignMode === 'custom' && isManager && (
              <select
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box', animation: 'fadeSlideIn 0.2s ease' }}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">-- Select Employee --</option>
                {employees.filter(emp => emp.id !== user?.id).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                ))}
              </select>
            )}
          </div>

          {/* Priority & Due Date */}
          <div className="form-row" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Priority</label>
              <select
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Task Due Date</label>
              <input
                type="date"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !isFormValid()}
            style={{
              marginTop: '16px',
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Assigning...' : 'Assign Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAssignment;
