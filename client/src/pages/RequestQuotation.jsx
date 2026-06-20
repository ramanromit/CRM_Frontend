import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import './Auth.css';

const RequestQuotation = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    requirement: ''
  });
  const [items, setItems] = useState([
    { item_name: '', price: '', quantity: 1 }
  ]);
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
    }
    setDropdownOpen(false);
    setSearchTerm('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { item_name: '', price: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length > 0 ? newItems : [{ item_name: '', price: '', quantity: 1 }]);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const p = Number(item.price) || 0;
      const q = Number(item.quantity) || 0;
      return sum + (p * q);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCompany) {
      setError('Please select a company.');
      return;
    }
    const validItems = items.filter(it => it.item_name.trim() !== '');
    if (validItems.length === 0) {
      setError('Please add at least one item.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/quotation/create`, {
        company_id: selectedCompany.id,
        requirement: formData.requirement,
        items: validItems
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setSuccess('Quotation requested successfully! An activity has been auto-registered.');
        setFormData({ requirement: '' });
        setItems([{ item_name: '', price: '', quantity: 1 }]);
        setSelectedCompany(null);
        setTimeout(() => navigate('/quotations'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Request Quotation</h1>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
          Submit a quotation request to the accounts team by listing the items, quantities, and optional pricing.
        </p>

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
            <label style={labelStyle}>Select Company *</label>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '100%', backgroundColor: 'var(--bg-input)',
                border: selectedCompany ? '1px solid #4caf50' : '1px solid var(--border-color)',
                color: 'var(--text-main)', padding: '14px 16px', borderRadius: '8px',
                fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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
                ✓ {selectedCompany.name} — {selectedCompany.industry || 'N/A'}
              </div>
            )}

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '8px', marginTop: '6px', maxHeight: '260px', overflowY: 'auto',
                boxShadow: '0 16px 48px rgba(0,0,0,0.1)', animation: 'fadeSlideIn 0.2s ease',
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                  <input
                    type="text" placeholder="Search companies..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)',
                      color: 'var(--text-main)', padding: '10px 12px', borderRadius: '6px', fontSize: '13px',
                      boxSizing: 'border-box', outline: 'none',
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
                      <div key={company.id} onClick={() => handleCompanySelect(company)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                          cursor: 'pointer', backgroundColor: isChecked ? 'rgba(76,175,80,0.12)' : 'transparent',
                          borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                        onMouseOut={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '4px',
                          border: isChecked ? '2px solid #4caf50' : '2px solid var(--border-color)',
                          backgroundColor: isChecked ? '#4caf50' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease', flexShrink: 0,
                        }}>
                          {isChecked && <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{company.name}</div>
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

          {/* Items Section */}
          <div style={{ marginTop: '24px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Quotation Items</h3>
              <button
                type="button"
                onClick={addItem}
                style={{
                  padding: '6px 12px', background: '#667eea', color: 'white', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                }}
              >
                + Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ flex: 2 }}>
                  <input
                    type="text"
                    placeholder="Item Name"
                    className="form-input"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    className="form-input"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    placeholder="Qty"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    min="1"
                    required
                  />
                </div>
                <div style={{ minWidth: '80px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>
                  ₹{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  style={{
                    background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer',
                    fontSize: '18px', fontWeight: 700, padding: '0 8px'
                  }}
                  title="Remove Item"
                >
                  ✕
                </button>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Total Calculated Value:</span>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#2e7d32' }}>
                ₹{calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Requirement Description */}
          <div style={{ marginTop: '20px' }}>
            <label style={labelStyle}>Additional Notes / Requirements (Optional)</label>
            <textarea
              name="requirement" className="form-input"
              placeholder="Any extra instructions or specifications..."
              style={{ minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              value={formData.requirement} onChange={handleChange}
            />
          </div>

          {/* Submit */}
          <button
            type="submit" className="submit-btn"
            disabled={loading || !selectedCompany || items.filter(it => it.item_name.trim() !== '').length === 0}
            style={{
              marginTop: '20px',
              opacity: (selectedCompany && items.filter(it => it.item_name.trim() !== '').length > 0) ? 1 : 0.5,
              cursor: (selectedCompany && items.filter(it => it.item_name.trim() !== '').length > 0) ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Submitting...' : 'Request Quotation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestQuotation;
