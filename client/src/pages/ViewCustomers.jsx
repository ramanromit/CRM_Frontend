import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ViewCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get('http://localhost:5000/api/customer/list', { headers });
        if (res.data.success) setCustomers(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch customers');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const thStyle = {
    padding: '14px 16px',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)'
  };

  const tdStyle = { padding: '14px 16px', fontSize: '14px' };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Customers</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {customers.length} converted {customers.length === 1 ? 'customer' : 'customers'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/add-customer')}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Add Customer
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading customers...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>
          ⚠ {error}
        </div>
      ) : customers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>🏢</div>
          <h3 style={{ fontWeight: 500, marginBottom: '8px', fontSize: '20px' }}>No customers yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Convert a client to a customer to see them here.
          </p>
          <button
            onClick={() => navigate('/add-customer')}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            + Add Customer
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                  <th style={thStyle}>Customer Code</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Relation</th>
                  <th style={thStyle}>Converted Date</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={customer.customer_id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                      animation: `fadeIn 0.3s ease ${index * 0.04}s both`,
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: 'var(--primary)', fontWeight: 600 }}>{customer.customer_code}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{customer.company_name}</td>
                    <td style={tdStyle}>
                       {customer.company_phone ? (
                         <a href={`tel:${customer.company_phone}`} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                           onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                           onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                         >
                           📞 {customer.company_phone}
                         </a>
                       ) : (
                         <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                       )}
                     </td>
                     <td style={tdStyle}>
                       {customer.company_email ? (
                         <a href={`mailto:${customer.company_email}`} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                           onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                           onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                         >
                           ✉ {customer.company_email}
                         </a>
                       ) : (
                         <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                       )}
                     </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: customer.relation_type === 'good' ? 'rgba(76,175,80,0.12)' : 
                                         customer.relation_type === 'bad' ? 'rgba(244,67,54,0.12)' : 
                                         'rgba(255,193,7,0.12)',
                        color: customer.relation_type === 'good' ? '#8ed694' : 
                               customer.relation_type === 'bad' ? '#ff8a80' : 
                               '#ffd54f',
                        textTransform: 'capitalize',
                      }}>
                        {customer.relation_type}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDate(customer.conversion_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ViewCustomers;
