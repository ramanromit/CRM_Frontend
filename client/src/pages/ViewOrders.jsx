import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { PackageIcon, FileIcon, CheckCircleIcon, HourglassIcon, SearchIcon, CreditCardIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ViewOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFY, setFilterFY] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Update Payment Modal
  const [paymentModal, setPaymentModal] = useState(null); // order object
  const [newPaymentDone, setNewPaymentDone] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE_URL}/api/orders/list`, { headers });
      if (res.data.success) setOrders(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const openPaymentModal = (order) => {
    setPaymentModal(order);
    setNewPaymentDone(String(Number(order.payment_done) || 0));
    setPaymentError('');
    setPaymentSuccess('');
  };

  const closePaymentModal = () => {
    setPaymentModal(null);
    setNewPaymentDone('');
    setPaymentError('');
    setPaymentSuccess('');
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_BASE_URL}/api/orders/update-payment/${paymentModal.order_id}`,
        { payment_done: newPaymentDone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setPaymentSuccess('Payment updated successfully!');
        // Update local state immediately
        setOrders(prev => prev.map(o =>
          o.order_id === paymentModal.order_id
            ? { ...o, payment_done: res.data.order.payment_done, payment_due: res.data.order.payment_due }
            : o
        ));
        setTimeout(() => closePaymentModal(), 1500);
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || err.message || 'Failed to update payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Unique financial years for filter dropdown
  const financialYears = [...new Set(orders.map(o => o.financial_year).filter(Boolean))].sort().reverse();

  // Filtering
  let filtered = orders;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(o =>
      (o.order_code || '').toLowerCase().includes(q) ||
      (o.company_name || '').toLowerCase().includes(q) ||
      (o.customer_code || '').toLowerCase().includes(q)
    );
  }
  if (filterFY !== 'all') {
    filtered = filtered.filter(o => o.financial_year === filterFY);
  }

  // Summary cards
  const totalOrders = filtered.length;
  const totalValue = filtered.reduce((s, o) => s + Number(o.order_value || 0), 0);
  const totalPaid = filtered.reduce((s, o) => s + Number(o.payment_done || 0), 0);
  const totalDue = filtered.reduce((s, o) => s + Number(o.payment_due || 0), 0);

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (['order_value', 'payment_done', 'payment_due'].includes(sortField)) {
      valA = Number(valA) || 0; valB = Number(valB) || 0;
    } else if (['created_at', 'order_date'].includes(sortField)) {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const thStyle = {
    padding: '16px 20px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
    color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-sidebar)',
  };

  const tdStyle = {
    padding: '16px 20px', fontSize: '14px', borderBottom: '1px solid var(--border-color)',
  };

  const summaryCardStyle = (gradient) => ({
    flex: '1 1 200px', background: gradient, borderRadius: '12px', padding: '20px 24px',
    color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
  });

  // Computed live preview for modal
  const previewDue = paymentModal
    ? Math.max(0, Number(paymentModal.order_value) - Number(newPaymentDone || 0))
    : 0;

  return (
    <div style={{ padding: '0 1rem', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '32px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Orders</h1>
          <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Manage and track all customer orders and payments.
          </p>
        </div>
        {user?.role !== 'user' && (
          <button
            onClick={() => navigate('/add-order')}
            style={{
              background: 'var(--primary)', border: 'none', color: 'white', padding: '12px 20px',
              borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              transition: 'background 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 6px rgba(46, 125, 50, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>⊕</span> NEW ORDER
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={summaryCardStyle('linear-gradient(135deg, #2e7d32, #43a047)')}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, marginBottom: '6px' }}>Total Orders</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{totalOrders}</div>
          </div>
          <div style={summaryCardStyle('linear-gradient(135deg, #1565c0, #42a5f5)')}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, marginBottom: '6px' }}>Total Value</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{formatCurrency(totalValue)}</div>
          </div>
          <div style={summaryCardStyle('linear-gradient(135deg, #00695c, #26a69a)')}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, marginBottom: '6px' }}>Total Paid</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{formatCurrency(totalPaid)}</div>
          </div>
          <div style={summaryCardStyle('linear-gradient(135deg, #c62828, #ef5350)')}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, marginBottom: '6px' }}>Total Due</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{formatCurrency(totalDue)}</div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <input
            type="text" placeholder="Search by order code, customer or company..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 40px', borderRadius: '8px',
              border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex', alignItems: 'center' }}><SearchIcon size={16} /></span>
        </div>
        {financialYears.length > 0 && (
          <div style={{ flex: '0 1 auto' }}>
            <select value={filterFY} onChange={(e) => setFilterFY(e.target.value)}
              style={{
                padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '14px',
                cursor: 'pointer', minWidth: '150px'
              }}>
              <option value="all">FY: All</option>
              {financialYears.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
          </div>
        )}
        {(searchQuery || filterFY !== 'all') && (
          <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => { setSearchQuery(''); setFilterFY('all'); }}
              style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: '8px 12px' }}>
              Clear Filters ✕
            </button>
          </div>
        )}
      </div>

      {/* Content Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading orders...</p>
        </div>
      ) : error ? (
        <div style={{ color: '#d32f2f', background: '#ffebee', padding: '16px 20px', borderRadius: '8px', fontSize: '14px' }}>⚠ {error}</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PackageIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ fontWeight: 500, marginBottom: '8px', fontSize: '18px' }}>No orders found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {searchQuery || filterFY !== 'all' ? 'Try adjusting your filters.' : 'Create your first order to get started.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={thStyle} onClick={() => handleSort('order_code')}>ORDER CODE</th>
                  <th style={thStyle} onClick={() => handleSort('company_name')}>CUSTOMER</th>
                  <th style={thStyle} onClick={() => handleSort('order_value')}>ORDER VALUE</th>
                  <th style={thStyle} onClick={() => handleSort('payment_done')}>PAID</th>
                  <th style={thStyle} onClick={() => handleSort('payment_due')}>DUE</th>
                  <th style={thStyle} onClick={() => handleSort('financial_year')}>FY</th>
                  <th style={thStyle} onClick={() => handleSort('order_date')}>DATE</th>
                  <th style={thStyle} onClick={() => handleSort('owner_name')}>CREATED BY</th>
                  <th style={{ ...thStyle, cursor: 'default' }}>ATTACHMENT</th>
                  {user?.role !== 'marketing' && <th style={{ ...thStyle, cursor: 'default' }}>ACTION</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => (
                  <tr key={order.order_id}
                    style={{ transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: 'var(--primary)', fontWeight: 700, fontFamily: 'monospace', fontSize: '13px' }}>
                      {order.order_code}
                    </td>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{order.company_name}</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{order.customer_code}</div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(order.order_value)}</td>
                    <td style={{ ...tdStyle, color: '#4caf50', fontWeight: 500 }}>{formatCurrency(order.payment_done)}</td>
                    <td style={{ ...tdStyle, color: Number(order.payment_due) > 0 ? '#ef5350' : '#4caf50', fontWeight: 600 }}>
                      {Number(order.payment_due) > 0 ? formatCurrency(order.payment_due) : '✓ Paid'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, backgroundColor: 'rgba(33,150,243,0.1)', color: '#42a5f5' }}>
                        {order.financial_year}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDate(order.order_date)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: 'white' }}>
                          {(order.owner_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>{order.owner_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {order.attachment ? (
                        <a href={`${API_BASE_URL}${order.attachment.file_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }} title={order.attachment.file_name}>
                          <FileIcon size={14} /> View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                    {user?.role !== 'marketing' && (
                      <td style={tdStyle}>
                        <button
                          onClick={() => openPaymentModal(order)}
                          title="Update Payment"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: Number(order.payment_due) > 0 ? '#ef5350' : '#4caf50',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <CreditCardIcon size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {sorted.length} {sorted.length === 1 ? 'order' : 'orders'}</span>
          </div>
        </div>
      )}

      {/* Update Payment Modal */}
      {paymentModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease' }}
          onClick={closePaymentModal}
        >
          <div
            style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', position: 'relative', animation: 'slideUp 0.3s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closePaymentModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>

            <h2 style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '20px' }}>Update Payment</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Order <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{paymentModal.order_code}</strong> — {paymentModal.company_name}
            </p>

            {/* Order value summary */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Order Value', value: formatCurrency(paymentModal.order_value), color: 'var(--text-main)' },
                { label: 'Current Paid', value: formatCurrency(paymentModal.payment_done), color: '#4caf50' },
                { label: 'Current Due', value: formatCurrency(paymentModal.payment_due), color: Number(paymentModal.payment_due) > 0 ? '#ef5350' : '#4caf50' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>

            {paymentError && (
              <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '13px' }}>⚠ {paymentError}</div>
            )}
            {paymentSuccess && (
              <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid rgba(76,175,80,0.25)', fontSize: '13px' }}>✓ {paymentSuccess}</div>
            )}

            <form onSubmit={handleUpdatePayment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  Total Payment Received (₹) *
                </label>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', fontSize: '18px', fontWeight: 600 }}
                  value={newPaymentDone}
                  onChange={(e) => setNewPaymentDone(e.target.value)}
                  min="0"
                  max={Number(paymentModal.order_value)}
                  step="0.01"
                  placeholder="Enter total amount paid"
                  required
                  autoFocus
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Enter the <strong>total cumulative amount paid</strong> (not just this instalment).
                </div>
              </div>

              {/* Live Due Preview */}
              <div style={{
                backgroundColor: 'var(--bg-input)', borderRadius: '10px', padding: '14px 16px',
                marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: `1px solid ${previewDue === 0 ? 'rgba(76,175,80,0.3)' : 'rgba(239,83,80,0.2)'}`,
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>New Payment Due</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: previewDue === 0 ? '#4caf50' : '#ef5350' }}>
                    {previewDue === 0 ? '✓ Fully Paid' : formatCurrency(previewDue)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {previewDue === 0 ? <CheckCircleIcon size={28} style={{ color: '#4caf50' }} /> : <HourglassIcon size={28} style={{ color: '#ef5350' }} />}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={closePaymentModal}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={paymentLoading}
                  style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '14px', opacity: paymentLoading ? 0.6 : 1 }}>
                  {paymentLoading ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ViewOrders;
