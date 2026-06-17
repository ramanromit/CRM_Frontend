import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ActivityDetail = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // History modal
  const [historyModal, setHistoryModal] = useState(null); // { activityId, activityQuery }
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState(null); // activity object
  const [editForm, setEditForm] = useState({ query: '', description: '', rep_name: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const navigate = useNavigate();

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`http://localhost:5000/api/activity/company/${companyId}`, { headers });
      if (res.data.success) {
        setCompany(res.data.company);
        setActivities(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [companyId, navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Open history modal
  const openHistory = async (activity) => {
    setHistoryModal({ activityId: activity.id, activityQuery: activity.query });
    setHistoryLoading(true);
    setHistory([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/activity/audit/${activity.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open edit modal
  const openEdit = (activity) => {
    setEditModal(activity);
    setEditForm({
      query: activity.query || '',
      description: activity.description || '',
      rep_name: activity.rep_name || '',
      status_tag: activity.status_tag || '',
      next_followup_date: activity.next_followup_date ? new Date(activity.next_followup_date).toISOString().split('T')[0] : '',
    });
    setEditSuccess('');
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/activity/update/${editModal.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setEditSuccess('Activity updated! Old values saved to history.');
        setTimeout(() => {
          setEditModal(null);
          setLoading(true);
          fetchActivities();
        }, 1500);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to update');
    } finally {
      setEditLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    marginBottom: '1.5rem',
  };

  const modalOverlay = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  };

  const modalCard = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '2rem',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
    border: '1px solid var(--border-color)',
    position: 'relative',
    animation: 'slideUp 0.3s ease',
  };

  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' };

  return (
    <div style={{ padding: '3rem', color: 'var(--text-main)', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button
            onClick={() => navigate('/activities')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              padding: 0, fontSize: '13px', cursor: 'pointer', marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Activity Log
          </button>
          <h1 style={{ margin: 0, fontWeight: 500, fontSize: '28px' }}>
            {loading ? 'Loading...' : company?.name || 'Company Activities'}
          </h1>
        </div>
        <button
          onClick={() => navigate('/add-activity')}
          style={{
            background: 'var(--primary)',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
        >
          + New Activity
        </button>
      </div>

      {/* Company Info Card */}
      {company && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary), #81c784)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 500, fontSize: '20px' }}>{company.name}</h2>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, marginTop: '4px',
                    backgroundColor: company.client_type === 'customer' ? 'rgba(33,150,243,0.12)' : 'rgba(255,193,7,0.12)',
                    color: company.client_type === 'customer' ? '#64b5f6' : '#ffd54f',
                    textTransform: 'capitalize',
                  }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: company.client_type === 'customer' ? '#64b5f6' : '#ffd54f',
                    }} />
                    {company.client_type}
                    {company.customer_code && ` · ${company.customer_code}`}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {company.industry && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Industry</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{company.industry}</div>
                </div>
              )}
              {company.domain && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Domain</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{company.domain}</div>
                </div>
              )}
              {company.relation_type && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Relation</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{company.relation_type}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Activities</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{activities.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading activities...</p>
        </div>
      ) : error ? (
        <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '14px' }}>
          ⚠ {error}
        </div>
      ) : activities.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.6 }}>📋</div>
          <h3 style={{ fontWeight: 500, marginBottom: '8px' }}>No activities recorded</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Register your first activity with this company.
          </p>
        </div>
      ) : (
        /* Activity Timeline */
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: '19px', top: '12px', bottom: '12px',
            width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0,
          }} />

          {activities.map((activity, index) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '16px',
                position: 'relative',
                animation: `fadeIn 0.3s ease ${index * 0.06}s both`,
              }}
            >
              {/* Timeline dot */}
              <div style={{
                width: '40px', flexShrink: 0,
                display: 'flex', justifyContent: 'center', paddingTop: '20px', zIndex: 1,
              }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  border: '3px solid var(--bg-main)',
                  boxShadow: '0 0 0 2px var(--primary)',
                }} />
              </div>

              {/* Activity card */}
              <div style={{
                ...cardStyle,
                marginBottom: 0,
                flex: 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{
                      backgroundColor: 'rgba(46,125,50,0.08)',
                      color: 'var(--primary)',
                      padding: '5px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}>
                      {activity.query}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📅</span> {formatDate(activity.activity_date)}
                  </div>
                </div>

                {activity.description && (
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 12px' }}>
                    {activity.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {/* Interacted By */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #81c784)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 600, color: 'white', flexShrink: 0,
                      }}>
                        {(activity.owner_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>{activity.owner_name}</div>
                        {activity.rep_name && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Rep: {activity.rep_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openHistory(activity)}
                      style={{
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      🕐 History
                    </button>
                    <button
                      onClick={() => openEdit(activity)}
                      style={{
                        background: 'rgba(46,125,50,0.08)',
                        border: '1px solid rgba(46,125,50,0.2)',
                        color: 'var(--primary)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(46,125,50,0.15)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(46,125,50,0.08)'; }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div style={modalOverlay} onClick={() => setHistoryModal(null)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setHistoryModal(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '20px', cursor: 'pointer', padding: '4px',
              }}
            >✕</button>

            <h2 style={{ margin: '0 0 4px', fontWeight: 500, fontSize: '20px' }}>Activity History</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Change log for: <strong style={{ color: 'var(--primary)' }}>{historyModal.activityQuery}</strong>
            </p>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{
                  width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>📜</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No edit history found.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', opacity: 0.7 }}>History is recorded when the activity is edited.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map((entry, idx) => (
                  <div key={idx} style={{
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    borderLeft: '3px solid var(--primary)',
                    animation: `fadeIn 0.25s ease ${idx * 0.08}s both`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Modified Field: {entry.field_name}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDateTime(entry.changed_at)} by {entry.changed_by}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Old Value</div>
                        <div style={{ color: '#ff8a80', textDecoration: 'line-through', whiteSpace: 'pre-wrap' }}>{entry.old_value || 'None'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>New Value</div>
                        <div style={{ color: '#4caf50', whiteSpace: 'pre-wrap' }}>{entry.new_value || 'None'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div style={modalOverlay} onClick={() => setEditModal(null)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditModal(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '20px', cursor: 'pointer', padding: '4px',
              }}
            >✕</button>

            <h2 style={{ margin: '0 0 4px', fontWeight: 500, fontSize: '20px' }}>Edit Activity</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Previous values will be saved to history automatically.
            </p>

            {editError && (
              <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(244,67,54,0.25)', fontSize: '13px' }}>
                ⚠ {editError}
              </div>
            )}
            {editSuccess && (
              <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(76,175,80,0.25)', fontSize: '13px' }}>
                ✓ {editSuccess}
              </div>
            )}

            <form className="auth-form" onSubmit={handleEditSubmit}>
              <div>
                <label style={labelStyle}>Query / Subject *</label>
                {company?.client_type === 'client' ? (
                  <select
                    className="form-input"
                    value={
                      ['Email Sent', 'Cold Call', 'Follow Up'].includes(editForm.query) 
                        ? editForm.query 
                        : 'Others'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'Others') {
                        setEditForm({ ...editForm, query: e.target.value });
                      } else {
                        setEditForm({ ...editForm, query: '' });
                      }
                    }}
                    required
                  >
                    <option value="" disabled>-- Select Query --</option>
                    <option value="Email Sent">Email Sent</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Others">Others</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.query}
                    onChange={(e) => setEditForm({ ...editForm, query: e.target.value })}
                    required
                  />
                )}
                {company?.client_type === 'client' && !['Email Sent', 'Cold Call', 'Follow Up'].includes(editForm.query) && (
                  <input
                    type="text"
                    className="form-input"
                    style={{ marginTop: '8px' }}
                    placeholder="Specify custom activity..."
                    value={editForm.query}
                    onChange={(e) => setEditForm({ ...editForm, query: e.target.value })}
                    required
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Status Tag</label>
                  <select
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={editForm.status_tag}
                    onChange={(e) => setEditForm({ ...editForm, status_tag: e.target.value })}
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
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={editForm.next_followup_date}
                    onChange={(e) => setEditForm({ ...editForm, next_followup_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Representative Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.rep_name}
                  onChange={(e) => setEditForm({ ...editForm, rep_name: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={editLoading || !editForm.query.trim()}
                style={{
                  marginTop: '8px',
                  opacity: editForm.query.trim() ? 1 : 0.5,
                  cursor: editForm.query.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ActivityDetail;
