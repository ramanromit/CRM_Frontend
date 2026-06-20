import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import './Auth.css';

const AddActivity = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    query: '',
    customQuery: '',
    description: '',
    rep_name: '',
    status_tag: '',
    next_followup_date: '',
    attachment: null,
  });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const res = await axios.get(`${API_BASE_URL}/api/company/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setCompanies(res.data.data);
      } catch (err) {
        setError('Failed to load companies');
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, [navigate]);

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

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company) => {
    if (selectedCompany?.id === company.id) {
      setSelectedCompany(null);
    } else {
      setSelectedCompany(company);
      // Reset query when switching company types to prevent weird states
      setFormData(prev => ({ ...prev, query: '', customQuery: '' }));
      setTouched(prev => ({ ...prev, query: false, customQuery: false }));
    }
    setDropdownOpen(false);
    setSearchTerm('');
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'attachment') {
      setFormData({ ...formData, attachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setTouched({ ...touched, [name]: true });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const validate = (name, value) => {
    switch (name) {
      case 'query':
        if (!value.trim()) return 'Query / subject is required';
        if (selectedCompany?.client_type !== 'client' && value.trim().length < 3) return 'Must be at least 3 characters';
        return '';
      case 'customQuery':
        if (formData.query === 'Others' && !value.trim()) return 'Please specify the custom query';
        if (formData.query === 'Others' && value.trim().length < 3) return 'Must be at least 3 characters';
        return '';
      default:
        return '';
    }
  };

  const getFieldError = (name) => {
    if (!touched[name]) return '';
    return validate(name, formData[name]);
  };

  const getFieldStatus = (name) => {
    if (!touched[name]) return 'idle';
    return validate(name, formData[name]) ? 'error' : 'valid';
  };

  const getInputBorder = (name) => {
    const status = getFieldStatus(name);
    if (status === 'valid') return '1px solid #4caf50';
    if (status === 'error') return '1px solid #f44336';
    return '1px solid var(--border-color)';
  };

  const isFormValid = () => {
    const isQueryValid = selectedCompany?.client_type === 'client' 
      ? (formData.query !== '' && (formData.query !== 'Others' || formData.customQuery.trim().length >= 3))
      : formData.query.trim().length >= 3;

    return selectedCompany && isQueryValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTouched({ query: true, customQuery: true });

    if (!selectedCompany) {
      setError('Please select a company for the activity.');
      return;
    }
    if (!isFormValid()) {
      setError('Please fix the errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const finalQuery = formData.query === 'Others' ? formData.customQuery : formData.query;

      const submitData = new FormData();
      submitData.append('company_id', selectedCompany.id);
      submitData.append('query', finalQuery);
      submitData.append('description', formData.description);
      submitData.append('rep_name', formData.rep_name);
      submitData.append('status_tag', formData.status_tag);
      submitData.append('next_followup_date', formData.next_followup_date || '');
      if (formData.attachment) {
        submitData.append('attachment', formData.attachment);
      }
      
      const res = await axios.post(`${API_BASE_URL}/api/activity/create`, submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      if (res.data.success) {
        setSuccess('Activity registered successfully!');
        setFormData({ query: '', customQuery: '', description: '', rep_name: '', status_tag: '', next_followup_date: '', attachment: null });
        setSelectedCompany(null);
        setTouched({});
        setTimeout(() => navigate('/activities'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };
  const inputWrapperStyle = { flex: 1, position: 'relative' };
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Register Activity</h1>
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

          {/* Company Selector with Checkbox */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <label style={labelStyle}>Select Company *</label>
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
                {/* Search */}
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
                        {/* Checkbox */}
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
                        {/* Company info */}
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

          {/* Row 1: Query & Date */}
          <div className="form-row" style={{ marginTop: '4px' }}>
            <div style={inputWrapperStyle}>
              <label style={labelStyle}>Query / Subject *</label>
              
              {selectedCompany?.client_type === 'client' ? (
                <>
                  <select
                    id="activity-query-dropdown"
                    name="query"
                    className="form-input"
                    style={{ border: getInputBorder('query'), width: '100%', boxSizing: 'border-box' }}
                    value={formData.query}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <option value="">-- Select Status Tag --</option>
                    <option value="Email Sent">Email Sent</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Others">Others</option>
                  </select>
                  <div style={feedbackStyle('query')}>{getFieldError('query')}</div>

                  {formData.query === 'Others' && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={labelStyle}>Custom Query *</label>
                      {statusIcon('customQuery')}
                      <input
                        type="text"
                        name="customQuery"
                        className="form-input"
                        placeholder="Specify custom activity..."
                        style={{ border: getInputBorder('customQuery') }}
                        value={formData.customQuery}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoFocus
                      />
                      <div style={feedbackStyle('customQuery')}>{getFieldError('customQuery')}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {statusIcon('query')}
                  <input
                    id="activity-query"
                    type="text"
                    name="query"
                    className="form-input"
                    placeholder="e.g. Follow-up on proposal"
                    style={{ border: getInputBorder('query') }}
                    value={formData.query}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <div style={feedbackStyle('query')}>{getFieldError('query') || (getFieldStatus('query') === 'valid' ? 'Looks good!' : '')}</div>
                </>
              )}
            </div>
          </div>

          {/* Row 2: Status Tag & Follow-up Date */}
          <div className="form-row" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status Tag</label>
              <select
                name="status_tag"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.status_tag}
                onChange={handleChange}
              >
                <option value="">-- Select Status --</option>
                <option value="Interested">Interested</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Payment Pending">Payment Pending</option>
                <option value="Urgent Attention">Urgent Attention</option>
                <option value="Future Requirement">Future Requirement</option>
                <option value="No Response">No Response</option>
                <option value="Lost Interest">Lost Interest</option>
                <option value="Customer Converted">Customer Converted</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Next Follow-up Date (Optional)</label>
              <input
                type="date"
                name="next_followup_date"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.next_followup_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Row 3: Rep Name */}
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Representative Name</label>
            <input
              id="activity-rep-name"
              type="text"
              name="rep_name"
              className="form-input"
              placeholder="e.g. John Doe"
              value={formData.rep_name}
              onChange={handleChange}
            />
          </div>

          {/* Description & Attachment */}
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              id="activity-description"
              name="description"
              className="form-input"
              placeholder="Describe the activity in detail..."
              style={{ minHeight: '120px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Attachment (Optional)</label>
            <input
              type="file"
              name="attachment"
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px' }}
              onChange={handleChange}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Upload any supporting document (image, pdf, etc.)
            </div>
          </div>

          {/* Submit */}
          <button
            id="submit-activity"
            type="submit"
            className="submit-btn"
            disabled={loading || !isFormValid()}
            style={{
              marginTop: '8px',
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Registering...' : 'Register Activity'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddActivity;
