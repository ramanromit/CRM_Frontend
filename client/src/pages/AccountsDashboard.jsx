import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import './OwnerDashboard.css';

const AccountsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expand toggles
  const [expanded, setExpanded] = useState({
    pendingRequests: false,
    activityLog: false,
    proposalsMonth: false
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const [qRes, actRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/quotation/list`, { headers }),
        axios.get(`${API_BASE_URL}/api/activity/list`, { headers })
      ]);

      if (qRes.data.success) setQuotations(qRes.data.data);
      if (actRes.data.success) setActivities(actRes.data.data);
    } catch (err) {
      setError('Failed to load accounts dashboard metrics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProposalsThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return quotations.filter(q => {
      if (q.status === 'requested' || q.prepared_by !== user?.id) return false;
      const date = new Date(q.updated_at || q.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  };

  const getPendingRequests = () => {
    return quotations.filter(q => q.status === 'requested');
  };

  const proposalsThisMonth = getProposalsThisMonth();
  const pendingRequests = getPendingRequests();

  const getStatusChartData = () => {
    const statuses = { requested: 0, sent: 0, accepted: 0, rejected: 0 };
    quotations.forEach(q => {
      if (statuses[q.status] !== undefined) {
        statuses[q.status]++;
      }
    });

    return [
      { name: 'Pending (Requested)', count: statuses.requested, color: '#f59e0b' },
      { name: 'Sent (Pending Response)', count: statuses.sent, color: '#3b82f6' },
      { name: 'Accepted', count: statuses.accepted, color: '#10b981' },
      { name: 'Rejected', count: statuses.rejected, color: '#ef4444' }
    ];
  };

  const statusChartData = getStatusChartData();

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="owner-dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Loading accounts dashboard...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>Accounts Dashboard</h1>
          <span className="status-badge status-info">Accounts Workspace</span>
        </div>
        <p style={{ marginTop: '8px' }}>Manage quotation requests, review activity logs, and track proposal statistics.</p>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(244,67,54,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(244,67,54,0.25)' }}>
          ⚠ {error}
        </div>
      )}

      {/* KPI Section */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-title">Quotation Requests (Pending)</div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>{pendingRequests.length}</div>
          <div className="kpi-desc">Requires immediate action</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-title">Proposals Sent (This Month)</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{proposalsThisMonth.length}</div>
          <div className="kpi-desc">Fulfilled in the current month</div>
        </div>
      </div>
      {/* Charts Section */}
      <div className="charts-grid" style={{ marginTop: '2rem' }}>
        <div className="chart-card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div className="chart-header" style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '16px' }}>
            Quotation Pipeline Distribution
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Quotations">
                {statusChartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Main Grid: Pending Requests & Activity Log */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', marginTop: '2rem', gap: '24px' }}>
        
        {/* Quotation Requests Column */}
        <div className="table-card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Upcoming Quotation Requests</h3>
            <button
              onClick={() => navigate('/quotations')}
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              View All Requests →
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No pending quotation requests found.</p>
          ) : (
            <>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Quotation #</th>
                    <th>Company</th>
                    <th>Requested By</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded.pendingRequests ? pendingRequests : pendingRequests.slice(0, 5)).map((q) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, color: '#667eea' }}>{q.quotation_number}</td>
                      <td>{q.company_name}</td>
                      <td>{q.requester_name}</td>
                      <td>{formatDate(q.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/quotations`)}
                          style={{
                            padding: '4px 10px', background: 'linear-gradient(135deg, #43a047, #66bb6a)',
                            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                          }}
                        >
                          Fulfill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingRequests.length > 5 && (
                <div
                  onClick={() => setExpanded(p => ({ ...p, pendingRequests: !p.pendingRequests }))}
                  style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', borderTop: '1px solid var(--border-color)', marginTop: '12px', userSelect: 'none' }}
                >
                  {expanded.pendingRequests ? '▲ Show Less' : `▼ Show More (+${pendingRequests.length - 5} requests)`}
                </div>
              )}
            </>
          )}
        </div>

        {/* Short Activity Log Column */}
        <div className="table-card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>My Recent Activities</h3>
            <button
              onClick={() => navigate('/activities')}
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              View All →
            </button>
          </div>

          {activities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No activities logged yet.</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(expanded.activityLog ? activities : activities.slice(0, 5)).map((act) => (
                  <div key={act.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{act.company_name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(act.activity_date)}</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.query}
                    </p>
                  </div>
                ))}
              </div>
              {activities.length > 5 && (
                <div
                  onClick={() => setExpanded(p => ({ ...p, activityLog: !p.activityLog }))}
                  style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', marginTop: '12px', userSelect: 'none' }}
                >
                  {expanded.activityLog ? '▲ Show Less' : `▼ Show More (+${activities.length - 5} activities)`}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Proposals Sent This Month Section */}
      <div style={{ marginTop: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '18px', fontWeight: 600 }}>Proposals Sent This Month</h3>

        {proposalsThisMonth.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No proposals sent this month.</p>
        ) : (
          <>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Company</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(expanded.proposalsMonth ? proposalsThisMonth : proposalsThisMonth.slice(0, 5)).map((q) => {
                  const statusColors = {
                    sent: { bg: '#e3f2fd', text: '#1565c0' },
                    accepted: { bg: '#e8f5e9', text: '#2e7d32' },
                    rejected: { bg: '#fce4ec', text: '#c62828' }
                  };
                  const colors = statusColors[q.status] || { bg: '#f5f5f5', text: '#616161' };
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, color: '#667eea', cursor: 'pointer' }} onClick={() => navigate(`/quotation/${q.id}`)}>
                        {q.quotation_number}
                      </td>
                      <td>{q.company_name}</td>
                      <td style={{ fontWeight: 600, color: '#2e7d32' }}>
                        ₹{Number(q.estimated_value).toLocaleString()}
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: colors.bg, color: colors.text, textTransform: 'capitalize' }}>
                          {q.status}
                        </span>
                      </td>
                      <td>{formatDate(q.valid_until)}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={q.remarks}>
                        {q.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {proposalsThisMonth.length > 5 && (
              <div
                onClick={() => setExpanded(p => ({ ...p, proposalsMonth: !p.proposalsMonth }))}
                style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', borderTop: '1px solid var(--border-color)', marginTop: '12px', userSelect: 'none' }}
              >
                {expanded.proposalsMonth ? '▲ Show Less' : `▼ Show More (+${proposalsThisMonth.length - 5} records)`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccountsDashboard;
