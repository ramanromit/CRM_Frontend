import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const AddOrder = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getCurrentFY = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    // Indian FY: April to March
    if (month >= 3) {
      return `${year}-${String(year + 1).slice(2)}`;
    } else {
      return `${year - 1}-${String(year).slice(2)}`;
    }
  };

  const [formData, setFormData] = useState({
    customer_id: '',
    order_value: '',
    payment_done: '',
    financial_year: getCurrentFY(),
    attachment: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
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
    fetchCustomers();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'attachment') {
      setFormData({ ...formData, attachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const paymentDue = Math.max(0, Number(formData.order_value || 0) - Number(formData.payment_done || 0));

  const isFormValid = () => {
    return formData.customer_id && Number(formData.order_value) > 0 && formData.financial_year.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isFormValid()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      submitData.append('customer_id', formData.customer_id);
      submitData.append('order_value', formData.order_value);
      submitData.append('payment_done', formData.payment_done || 0);
      submitData.append('financial_year', formData.financial_year);
      if (formData.attachment) {
        submitData.append('attachment', formData.attachment);
      }

      const res = await axios.post('http://localhost:5000/api/orders/create', submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      if (res.data.success) {
        setSuccess(`Order ${res.data.order.order_code} created successfully!`);
        setFormData({ customer_id: '', order_value: '', payment_done: '', financial_year: getCurrentFY(), attachment: null });
        setTimeout(() => navigate('/orders'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => navigate('/orders')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              padding: 0, fontSize: '13px', cursor: 'pointer', marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Orders
          </button>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Create New Order</h1>
        </div>
      </div>

      {/* Form Card */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        {error && (
          <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(76,175,80,0.25)', fontSize: '14px' }}>
            ✓ {success}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Customer *</label>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading customers...</p>
            ) : customers.length === 0 ? (
              <p style={{ color: '#ffcc00', fontSize: '14px' }}>No customers available. Convert a client first.</p>
            ) : (
              <select
                name="customer_id"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.customer_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Select a Customer --</option>
                {customers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.company_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Order Value & Payment Done */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Order Value (₹) *</label>
              <input
                type="number"
                name="order_value"
                className="form-input"
                placeholder="e.g. 50000"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.order_value}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Payment Done (₹)</label>
              <input
                type="number"
                name="payment_done"
                className="form-input"
                placeholder="e.g. 20000"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.payment_done}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Payment Due (calculated) */}
          <div style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Payment Due</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: paymentDue > 0 ? '#ef5350' : '#4caf50',
              }}>
                ₹{paymentDue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: paymentDue > 0 ? 'rgba(239,83,80,0.1)' : 'rgba(76,175,80,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
            }}>
              {paymentDue > 0 ? '⏳' : '✅'}
            </div>
          </div>

          {/* Financial Year & Attachment */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Financial Year *</label>
              <input
                type="text"
                name="financial_year"
                className="form-input"
                placeholder="e.g. 2025-26"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.financial_year}
                onChange={handleChange}
                required
              />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Format: YYYY-YY
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Attachment (PO / Invoice)</label>
              <input
                type="file"
                name="attachment"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px' }}
                onChange={handleChange}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Upload order document (optional)
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting || !isFormValid()}
            style={{
              marginTop: '8px',
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Creating Order...' : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddOrder;
