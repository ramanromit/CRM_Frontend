import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ViewQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAccounts = user?.role === 'accounts';

  // Fulfill modal
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [fulfillTarget, setFulfillTarget] = useState(null);
  const [fulfillForm, setFulfillForm] = useState({ estimated_value: '', valid_until: '', remarks: '', quotation_file: null, items: [] });
  const [fulfillLoading, setFulfillLoading] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const res = await axios.get(`${API_BASE_URL}/api/quotation/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setQuotations(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const statusBadge = (status) => {
    const colors = {
      requested: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
      sent: { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
      accepted: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
      rejected: { bg: '#fce4ec', text: '#c62828', border: '#ef9a9a' },
    };
    const c = colors[status] || { bg: '#f5f5f5', text: '#616161', border: '#bdbdbd' };
    return (
      <span style={{
        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchesSearch = !searchQuery ||
      q.quotation_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.requester_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openFulfillModal = (q) => {
    setFulfillTarget(q);
    setFulfillForm({
      estimated_value: q.estimated_value || '',
      valid_until: '',
      remarks: '',
      quotation_file: null,
      items: Array.isArray(q.items) && q.items.length > 0 ? q.items : [{ item_name: '', price: '', quantity: 1 }]
    });
    setFulfillModalOpen(true);
  };

  const handleModalItemChange = (index, field, value) => {
    const newItems = [...fulfillForm.items];
    newItems[index][field] = value;
    
    const sum = newItems.reduce((acc, it) => {
      const p = Number(it.price) || 0;
      const q = Number(it.quantity) || 0;
      return acc + (p * q);
    }, 0);

    setFulfillForm({
      ...fulfillForm,
      items: newItems,
      estimated_value: sum > 0 ? sum : fulfillForm.estimated_value
    });
  };

  const addModalItem = () => {
    setFulfillForm({
      ...fulfillForm,
      items: [...fulfillForm.items, { item_name: '', price: '', quantity: 1 }]
    });
  };

  const removeModalItem = (index) => {
    const newItems = fulfillForm.items.filter((_, i) => i !== index);
    const sum = newItems.reduce((acc, it) => {
      const p = Number(it.price) || 0;
      const q = Number(it.quantity) || 0;
      return acc + (p * q);
    }, 0);

    setFulfillForm({
      ...fulfillForm,
      items: newItems.length > 0 ? newItems : [{ item_name: '', price: '', quantity: 1 }],
      estimated_value: sum
    });
  };

  const handleFulfill = async (e) => {
    e.preventDefault();
    setFulfillLoading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('estimated_value', fulfillForm.estimated_value);
      fd.append('valid_until', fulfillForm.valid_until);
      fd.append('remarks', fulfillForm.remarks);
      fd.append('items', JSON.stringify(fulfillForm.items.filter(it => it.item_name.trim() !== '')));
      if (fulfillForm.quotation_file) {
        fd.append('quotation_file', fulfillForm.quotation_file);
      }
      await axios.put(`${API_BASE_URL}/api/quotation/fulfill/${fulfillTarget.id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setFulfillModalOpen(false);
      fetchQuotations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fulfill quotation');
    } finally {
      setFulfillLoading(false);
    }
  };

  const handleRespond = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/quotation/respond/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchQuotations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond');
    }
  };

  const cellStyle = { padding: '14px 16px', fontSize: '13px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)' };
  const headerCellStyle = { ...cellStyle, fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--bg-main)' };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>📋</div>
          <p>Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 3rem', color: 'var(--text-main)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>
            {isAccounts ? 'Quotation Requests' : 'My Quotations'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0', fontSize: '14px' }}>
            {isAccounts ? 'Review and fulfill incoming quotation requests.' : 'Track your quotation requests and responses.'}
          </p>
        </div>
        {!isAccounts && (
          <button
            onClick={() => navigate('/request-quotation')}
            style={{
              padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            + Request Quotation
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>
          ⚠ {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Search by quotation #, company, requester..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1, minWidth: '220px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)',
            color: 'var(--text-main)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none',
          }}
        />
        {['all', 'requested', 'sent', 'accepted', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)',
              background: filterStatus === s ? 'var(--text-main)' : 'transparent',
              color: filterStatus === s ? 'var(--bg-card)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s'
            }}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', count: quotations.length, color: '#607d8b' },
          { label: 'Requested', count: quotations.filter(q => q.status === 'requested').length, color: '#e65100' },
          { label: 'Sent', count: quotations.filter(q => q.status === 'sent').length, color: '#1565c0' },
          { label: 'Accepted', count: quotations.filter(q => q.status === 'accepted').length, color: '#2e7d32' },
          { label: 'Rejected', count: quotations.filter(q => q.status === 'rejected').length, color: '#c62828' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: 'var(--bg-card)', padding: '14px 16px', borderRadius: '10px',
            border: '1px solid var(--border-color)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {filteredQuotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>No quotations found</p>
          <p style={{ fontSize: '13px' }}>Quotation requests will appear here.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerCellStyle}>Quotation #</th>
                  <th style={headerCellStyle}>Company</th>
                  <th style={headerCellStyle}>Requested By</th>
                  <th style={headerCellStyle}>Requirement</th>
                  <th style={headerCellStyle}>Status</th>
                  <th style={headerCellStyle}>Est. Value</th>
                  <th style={headerCellStyle}>Date</th>
                  <th style={headerCellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => (
                  <tr key={q.id} style={{ transition: 'background 0.15s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...cellStyle, fontWeight: 600, color: '#667eea' }}>
                      <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/quotation/${q.id}`)}>
                        {q.quotation_number}
                      </span>
                    </td>
                    <td style={cellStyle}>{q.company_name}</td>
                    <td style={cellStyle}>{q.requester_name}</td>
                    <td style={{ ...cellStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.requirement || '—'}
                    </td>
                    <td style={cellStyle}>{statusBadge(q.status)}</td>
                    <td style={cellStyle}>{q.estimated_value ? `₹${Number(q.estimated_value).toLocaleString()}` : '—'}</td>
                    <td style={cellStyle}>{formatDate(q.created_at)}</td>
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => navigate(`/quotation/${q.id}`)}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
                            background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '12px',
                          }}
                        >
                          View
                        </button>
                        {isAccounts && q.status === 'requested' && (
                          <button
                            onClick={() => openFulfillModal(q)}
                            style={{
                              padding: '5px 12px', borderRadius: '6px', border: 'none',
                              background: 'linear-gradient(135deg, #43a047, #66bb6a)', color: 'white',
                              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                            }}
                          >
                            Fulfill
                          </button>
                        )}
                        {!isAccounts && q.status === 'sent' && q.requested_by === user?.id && (
                          <>
                            <button onClick={() => handleRespond(q.id, 'accepted')}
                              style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#43a047', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >Accept</button>
                            <button onClick={() => handleRespond(q.id, 'rejected')}
                              style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#e53935', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '2rem',
            width: '90%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Fulfill Quotation</h2>
              <button onClick={() => setFulfillModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <strong>{fulfillTarget?.quotation_number}</strong> — {fulfillTarget?.company_name}
              <br />
              <span style={{ color: 'var(--text-muted)' }}>Requested by: {fulfillTarget?.requester_name}</span>
            </div>
            <form onSubmit={handleFulfill}>
              {/* Item details inside Fulfill Modal */}
              <div style={{ marginBottom: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--bg-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Quotation Items</span>
                  <button
                    type="button"
                    onClick={addModalItem}
                    style={{
                      padding: '4px 8px', background: '#667eea', color: 'white', border: 'none',
                      borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600
                    }}
                  >
                    + Add Item
                  </button>
                </div>

                {fulfillForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                      <input
                        type="text"
                        placeholder="Item Name"
                        className="form-input"
                        value={item.item_name}
                        onChange={(e) => handleModalItemChange(idx, 'item_name', e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '12px' }}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        placeholder="Price"
                        className="form-input"
                        value={item.price}
                        onChange={(e) => handleModalItemChange(idx, 'price', e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '12px' }}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        placeholder="Qty"
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) => handleModalItemChange(idx, 'quantity', e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '12px' }}
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModalItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Estimated Value (₹) *</label>
                <input type="number" className="form-input" required
                  value={fulfillForm.estimated_value}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, estimated_value: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Valid Until</label>
                <input type="date" className="form-input"
                  value={fulfillForm.valid_until}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, valid_until: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Remarks</label>
                <textarea className="form-input"
                  value={fulfillForm.remarks}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, remarks: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Any notes or details..."
                />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Quotation File (PDF, etc.)</label>
                <input type="file" className="form-input"
                  onChange={(e) => setFulfillForm({ ...fulfillForm, quotation_file: e.target.files[0] })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setFulfillModalOpen(false)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '14px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={fulfillLoading}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg, #43a047, #66bb6a)', color: 'white',
                    cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  }}>
                  {fulfillLoading ? 'Sending...' : 'Send Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewQuotations;
