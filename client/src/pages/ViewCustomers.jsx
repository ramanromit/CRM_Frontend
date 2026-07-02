import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { BuildingIcon, PhoneIcon, MailIcon, RefreshIcon, PackageIcon, FileIcon, CheckCircleIcon, HourglassIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ViewCustomers = () => {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const canTransfer = ['developer', 'owner', 'manager'].includes(role);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Transfer states
  const [transferModal, setTransferModal] = useState(null); // customer object
  const [employees, setEmployees] = useState([]);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Details & Order history states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const handleRowClick = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerOrders([]);
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/orders/list?customer_id=${customer.customer_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCustomerOrders(res.data.data);
      }
    } catch (err) {
      setOrdersError(err.response?.data?.message || 'Failed to fetch order history');
    } finally {
      setOrdersLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedCustomer(null);
    setCustomerOrders([]);
  };

  const handleTransferClick = async (customer) => {
    setTransferModal(customer);
    setNewOwnerId('');
    setTransferReason('');
    setTransferError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/employee/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      setTransferError('Failed to load employees.');
    }
  };

  const handleCancelTransfer = () => {
    setTransferModal(null);
  };

  const handleTransferSubmit = async () => {
    if (!newOwnerId) {
      setTransferError('Please select a new owner.');
      return;
    }
    setTransferring(true);
    setTransferError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/customer/transfer/${transferModal.customer_id}`, {
        new_owner_id: newOwnerId,
        reason: transferReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Customer transferred successfully!');
        setCustomers(customers.map(c => c.customer_id === transferModal.customer_id ? { ...c, owner_id: newOwnerId } : c));
        setTransferModal(null);
      }
    } catch (err) {
      setTransferError(err.response?.data?.message || 'Failed to transfer customer');
    } finally {
      setTransferring(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(`${API_BASE_URL}/api/customer/list`, { headers });
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
    <div style={{ padding: '1.5rem', color: 'var(--text-main)', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Customers</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {customers.length} converted {customers.length === 1 ? 'customer' : 'customers'}
          </p>
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <BuildingIcon size={48} style={{ marginBottom: '16px', opacity: 0.6 }} />
          <h3 style={{ fontWeight: 500, marginBottom: '8px', fontSize: '20px' }}>No customers yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Convert a client to a customer by creating their first order.
          </p>
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
                  {canTransfer && <th style={thStyle}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={customer.customer_id}
                    onClick={() => handleRowClick(customer)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                      animation: `fadeIn 0.3s ease ${index * 0.04}s both`,
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: 'var(--primary)', fontWeight: 600 }}>{customer.customer_code}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{customer.company_name}</td>
                    <td style={tdStyle}>
                       {customer.company_phone ? (
                         <a href={`tel:${customer.company_phone}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                           onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                           onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                         >
                            <PhoneIcon size={14} style={{ color: 'var(--text-muted)' }} /> {customer.company_phone}
                         </a>
                       ) : (
                         <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                       )}
                     </td>
                     <td style={tdStyle}>
                       {customer.company_email ? (
                          <a href={`mailto:${customer.company_email}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                          >
                            <MailIcon size={14} style={{ color: 'var(--text-muted)' }} /> {customer.company_email}
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
                     {canTransfer && (
                       <td style={tdStyle}>
                         <button
                           onClick={(e) => { e.stopPropagation(); handleTransferClick(customer); }}
                           title="Transfer Customer"
                           style={{
                             background: 'transparent',
                             border: 'none',
                             color: 'var(--primary)',
                             cursor: 'pointer',
                             padding: '4px',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             transition: 'transform 0.2s'
                           }}
                           onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                           onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                         >
                           <RefreshIcon size={16} />
                         </button>
                       </td>
                     )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Transfer Customer</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Transfer customer code <strong>{transferModal.customer_code}</strong> ({transferModal.company_name}) to another employee.
            </p>
            
            {transferError && (
              <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', border: '1px solid rgba(244,67,54,0.2)' }}>
                {transferError}
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>New Owner *</label>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px' }}
              >
                <option value="">-- Select Employee --</option>
                {employees
                  .filter(emp => emp.id !== transferModal.owner_id)
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.role})
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Reason (Optional)</label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px', padding: '8px 12px' }}
                placeholder="Why is this being transferred?"
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleCancelTransfer}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleTransferSubmit}
                disabled={transferring}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: transferring ? 'not-allowed' : 'pointer' }}
              >
                {transferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details & Order History Modal */}
      {selectedCustomer && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}
          onClick={closeDetailsModal}
        >
          <div
            style={{ backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeDetailsModal}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer', padding: '4px' }}
            >
              ✕
            </button>

            {/* Modal Title */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{selectedCustomer.company_name}</span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: selectedCustomer.relation_type === 'good' ? 'rgba(76,175,80,0.15)' : 
                                   selectedCustomer.relation_type === 'bad' ? 'rgba(244,67,54,0.15)' : 
                                   'rgba(255,193,7,0.15)',
                  color: selectedCustomer.relation_type === 'good' ? '#8ed694' : 
                         selectedCustomer.relation_type === 'bad' ? '#ff8a80' : 
                         '#ffd54f',
                  textTransform: 'uppercase'
                }}>{selectedCustomer.relation_type} relation</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Customer Code: {selectedCustomer.customer_code}
              </p>
            </div>

            {/* Split layout: Details & Financials */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Customer/Company Information Card */}
              <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)' }}>Customer Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  {selectedCustomer.industry && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Industry:</span>
                      <span style={{ fontWeight: 500 }}>{selectedCustomer.industry}</span>
                    </div>
                  )}
                  {selectedCustomer.domain && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Domain:</span>
                      <span style={{ fontWeight: 500 }}>{selectedCustomer.domain}</span>
                    </div>
                  )}
                  {selectedCustomer.size && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Company Size:</span>
                      <span style={{ fontWeight: 500 }}>{selectedCustomer.size} employees</span>
                    </div>
                  )}
                  {selectedCustomer.website && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Website:</span>
                      <a href={selectedCustomer.website.startsWith('http') ? selectedCustomer.website : `https://${selectedCustomer.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {selectedCustomer.website}
                      </a>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                    <span style={{ fontWeight: 500 }}>{selectedCustomer.company_phone || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                    <span style={{ fontWeight: 500 }}>{selectedCustomer.company_email || '—'}</span>
                  </div>
                  {selectedCustomer.address && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Address:</span>
                      <span style={{ fontWeight: 500, fontSize: '13px', lineHeight: 1.4 }}>{selectedCustomer.address}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Conversion Date:</span>
                    <span style={{ fontWeight: 500 }}>{formatDate(selectedCustomer.conversion_date)}</span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics Card */}
              <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)' }}>Financial Performance</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Orders</div>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>{selectedCustomer.total_orders}</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Volume</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
                        {'₹' + (Number(selectedCustomer.total_order_volume) || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Paid</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#4caf50' }}>
                        {'₹' + (Number(selectedCustomer.total_payment_done) || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Outstanding Due</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: Number(selectedCustomer.total_payment_due) > 0 ? '#ef5350' : '#4caf50' }}>
                        {'₹' + (Number(selectedCustomer.total_payment_due) || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCustomer.source && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Lead Source:</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedCustomer.source}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order History Section */}
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>Order History</h3>
              {ordersLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
                  <div style={{ width: '18px', height: '18px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span>Loading order list...</span>
                </div>
              ) : ordersError ? (
                <div style={{ color: '#ff6b6b', fontSize: '14px', padding: '1rem 0' }}>⚠ {ordersError}</div>
              ) : customerOrders.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px', border: '1px solid var(--border-color)' }}>
                  No orders found for this customer.
                </div>
              ) : (
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Order Code</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Value</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Paid</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Due</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>FY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((order) => (
                        <tr key={order.order_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{order.order_code}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{formatDate(order.order_date)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                            {Number(order.order_value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#4caf50' }}>
                            {Number(order.payment_done).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: Number(order.payment_due) > 0 ? '#ef5350' : '#4caf50' }}>
                            {Number(order.payment_due) > 0 
                              ? Number(order.payment_due).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }) 
                              : '✓ Paid'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>{order.financial_year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={closeDetailsModal}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Details
              </button>
            </div>
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
