import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQuotationDetails();
  }, [id]);

  const fetchQuotationDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/api/quotation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setQuotation(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch quotation details');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (status) => {
    setActionLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/quotation/respond/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setQuotation(prev => ({ ...prev, status }));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update quotation to ${status}`);
    } finally {
      setActionLoading(false);
    }
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
        padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: 'capitalize',
        display: 'inline-block'
      }}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatValidUntil = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>📋</div>
          <p>Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(244,67,54,0.25)', marginBottom: '20px' }}>
          ⚠ {error}
        </div>
        <button onClick={() => navigate('/quotations')} className="submit-btn" style={{ maxWidth: '200px', margin: '0 auto' }}>
          Back to Quotations
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Header and navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => navigate('/quotations')}
            style={{
              background: 'none', border: 'none', color: '#667eea', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600, padding: 0, marginBottom: '8px', display: 'block'
            }}
          >
            ← Back to Quotations
          </button>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{quotation.quotation_number}</span>
            {statusBadge(quotation.status)}
          </h1>
        </div>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Main Details Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '18px' }}>Quotation Details</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Requirement / Description</span>
            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {quotation.requirement || 'No requirements specified.'}
            </div>
          </div>

          {Array.isArray(quotation.items) && quotation.items.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Itemized Breakdown</span>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--bg-main)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left', background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ padding: '10px 12px' }}>Item Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Price (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Quantity</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={index} style={{ borderBottom: index < quotation.items.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '13px' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.item_name}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{(item.price || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>₹{(item.total || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Remarks (from Accounts)</span>
            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {quotation.remarks || 'No remarks provided.'}
            </div>
          </div>

          {quotation.quotation_file && (
            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', border: '1px dashed #667eea', backgroundColor: 'rgba(102, 126, 234, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>Quotation Document Attached</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prepared and uploaded by the accounts team</span>
              </div>
              <a
                href={`${API_BASE_URL}${quotation.quotation_file}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px', background: '#667eea', color: 'white', textDecoration: 'none',
                  borderRadius: '6px', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6fd6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
              >
                Download File
              </a>
            </div>
          )}
        </div>

        {/* Info Sidebar Column */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Metadata Card */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Information</h4>
            
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Company Name</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{quotation.company_name}</span>
              </div>
              
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Requested By</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{quotation.requester_name}</span>
              </div>

              {quotation.preparer_name && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Prepared By (Accounts)</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{quotation.preparer_name}</span>
                </div>
              )}

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Estimated Value</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#2e7d32' }}>
                  {quotation.estimated_value ? `₹${Number(quotation.estimated_value).toLocaleString()}` : '—'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Valid Until</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatValidUntil(quotation.valid_until)}</span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Request Date</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(quotation.created_at)}</span>
              </div>

              {quotation.status !== 'requested' && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Last Updated</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(quotation.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Respond Card for requester */}
          {quotation.status === 'sent' && quotation.requested_by === user?.id && (
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Respond to Quotation</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Please review the document, estimated value, and validity date before responding.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => handleRespond('accepted')}
                  disabled={actionLoading}
                  style={{
                    padding: '10px', borderRadius: '8px', border: 'none', background: '#4caf50',
                    color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                  }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond('rejected')}
                  disabled={actionLoading}
                  style={{
                    padding: '10px', borderRadius: '8px', border: 'none', background: '#f44336',
                    color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;
