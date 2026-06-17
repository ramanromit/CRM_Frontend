import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Clients = () => {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const canTransfer = ['developer', 'owner', 'manager'].includes(role);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [editPriorityValue, setEditPriorityValue] = useState('');
  const [updating, setUpdating] = useState(false);

  const [transferModal, setTransferModal] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  const [historyModal, setHistoryModal] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const companiesRes = await axios.get('http://localhost:5000/api/company/list', { headers });

        if (companiesRes.data.success) {
          setCompanies(companiesRes.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleEditClick = (company) => {
    setEditingCompanyId(company.id);
    setEditPriorityValue(company.priority || 'low');
  };

  const handleCancelEdit = () => {
    setEditingCompanyId(null);
    setEditPriorityValue('');
  };

  const handleSavePriority = async (company) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { ...company, priority: editPriorityValue };
      const res = await axios.put(`http://localhost:5000/api/company/update/${company.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCompanies(companies.map(c => c.id === company.id ? { ...c, priority: editPriorityValue } : c));
        setEditingCompanyId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  const handleTransferClick = async (company) => {
    setTransferModal(company);
    setNewOwnerId('');
    setTransferReason('');
    setTransferError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/employee/list', {
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
      const res = await axios.post(`http://localhost:5000/api/company/transfer/${transferModal.id}`, {
        new_owner_id: newOwnerId,
        reason: transferReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Company transferred successfully!');
        setCompanies(companies.map(c => c.id === transferModal.id ? { ...c, owner_id: newOwnerId, Owner: employees.find(e => e.id === newOwnerId) } : c));
        setTransferModal(null);
      }
    } catch (err) {
      setTransferError(err.response?.data?.message || 'Failed to transfer company');
    } finally {
      setTransferring(false);
    }
  };

  const handleHistoryClick = async (company) => {
    setHistoryModal(company);
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/company/${company.id}/assignment-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistoryData(res.data.data);
      }
    } catch (err) {
      alert('Failed to load assignment history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: '28px' }}>Companies</h1>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p style={{ color: '#ff6b6b' }}>{error}</p>
      ) : (
        <div>
          {companies.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No companies found.</p>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                    <th style={{ padding: '16px' }}>Company Name</th>
                    <th style={{ padding: '16px' }}>Domain</th>
                    <th style={{ padding: '16px' }}>Current Owner</th>
                    <th style={{ padding: '16px' }}>Phone</th>
                    <th style={{ padding: '16px' }}>Email</th>
                    <th style={{ padding: '16px' }}>Industry</th>
                    <th style={{ padding: '16px' }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => {
                    const priorityColor = company.priority === 'high' ? '#f44336' : company.priority === 'medium' ? '#ffeb3b' : '#4caf50';
                    const priorityBg = company.priority === 'high' ? 'rgba(244,67,54,0.12)' : company.priority === 'medium' ? 'rgba(255,235,59,0.12)' : 'rgba(76,175,80,0.12)';
                    
                    return (
                      <tr key={company.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px' }}>{company.name}</td>
                        <td style={{ padding: '16px' }}>{company.domain}</td>
                        <td style={{ padding: '16px', fontWeight: 500, color: 'var(--primary)' }}>{company.Owner?.full_name || company.Owner?.email || 'Unknown'}</td>
                        <td style={{ padding: '16px' }}>
                          {company.phone ? (
                            <a href={`tel:${company.phone}`} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                            >
                              📞 {company.phone}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {company.email ? (
                            <a href={`mailto:${company.email}`} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                            >
                              ✉ {company.email}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', textTransform: 'capitalize' }}>{company.industry}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: priorityBg,
                              color: priorityColor,
                              textTransform: 'capitalize'
                            }}>
                              {company.priority || 'Low'}
                            </span>
                            <span 
                              onClick={() => handleEditClick(company)}
                              title="Edit Priority"
                              style={{ cursor: 'pointer', fontSize: '14px', opacity: 0.5, transition: 'opacity 0.2s' }}
                              onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                              onMouseOut={(e) => e.currentTarget.style.opacity = 0.5}
                            >
                              ✏️
                            </span>
                            {canTransfer && (
                              <span 
                                onClick={() => handleTransferClick(company)}
                                title="Transfer Company"
                                style={{ cursor: 'pointer', fontSize: '14px', opacity: 0.5, transition: 'opacity 0.2s', marginLeft: '4px' }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                                onMouseOut={(e) => e.currentTarget.style.opacity = 0.5}
                              >
                                🔄
                              </span>
                            )}
                            <span 
                              onClick={() => handleHistoryClick(company)}
                              title="Assignment History"
                              style={{ cursor: 'pointer', fontSize: '14px', opacity: 0.5, transition: 'opacity 0.2s', marginLeft: '4px' }}
                              onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                              onMouseOut={(e) => e.currentTarget.style.opacity = 0.5}
                            >
                              🕒
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Floating edit panel */}
          {editingCompanyId && (() => {
            const company = companies.find(c => c.id === editingCompanyId);
            if (!company) return null;
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
                    Edit Priority — <span style={{ color: 'var(--primary)' }}>{company.name}</span>
                  </h3>
                  <span 
                    onClick={handleCancelEdit}
                    style={{ cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >✕</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {['low', 'medium', 'high'].map(level => {
                    const color = level === 'high' ? '#f44336' : level === 'medium' ? '#ffeb3b' : '#4caf50';
                    const isActive = editPriorityValue === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditPriorityValue(level)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: `2px solid ${isActive ? color : 'var(--border-color)'}`,
                          backgroundColor: isActive ? `${color}22` : 'var(--bg-input)',
                          color: isActive ? color : 'var(--text-main)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: isActive ? color : 'var(--border-color)',
                          border: `2px solid ${color}`,
                          display: 'inline-block',
                        }} />
                        {level}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handleSavePriority(company)}
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
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px',
            width: '100%', maxWidth: '400px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Transfer Company</h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Transfer <strong>{transferModal.name}</strong> to another employee.
            </p>

            {transferError && (
              <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {transferError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>New Owner *</label>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
              >
                <option value="">Select an employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Reason (Optional)</label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', resize: 'vertical' }}
                placeholder="Why is this being transferred?"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelTransfer}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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

      {/* History Modal */}
      {historyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px',
            width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Assignment History</h2>
              <span onClick={() => setHistoryModal(null)} style={{ cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}>✕</span>
            </div>
            <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
              History for <strong>{historyModal.name}</strong>
            </p>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              {historyLoading ? (
                <p>Loading history...</p>
              ) : historyData.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No assignment history found for this company.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {historyData.map((record, index) => (
                    <div key={record.id} style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      position: 'relative'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Assigned by <strong>{record.AssignedBy?.full_name || 'System'}</strong></span>
                        <span>{new Date(record.assigned_at).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: record.reason ? '12px' : '0' }}>
                        <div style={{ flex: 1, padding: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>From</span>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{record.OldOwner?.full_name || 'Unknown'}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <div style={{ flex: 1, padding: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)', borderColor: 'var(--primary)' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>To</span>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--primary)' }}>{record.NewOwner?.full_name || 'Unknown'}</span>
                        </div>
                      </div>
                      {record.reason && (
                        <div style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic', paddingLeft: '8px', borderLeft: '2px solid var(--border-color)' }}>
                          "{record.reason}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
