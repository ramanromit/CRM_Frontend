import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import './OwnerDashboard.css';

const API = `${API_BASE_URL}/api/dashboard/staff`;

const StaffDashboard = () => {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [activityTrend, setActivityTrend] = useState([]);
  const [pipelineStatus, setPipelineStatus] = useState([]);
  const [followupHealth, setFollowupHealth] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    recentCompanies: false,
    recentActivities: false
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const headers = getHeaders();
        const [
          summaryRes, activityTrendRes, pipelineRes, followupRes,
          recentActivitiesRes, recentCompaniesRes
        ] = await Promise.all([
          axios.get(`${API}/summary`, { headers }),
          axios.get(`${API}/activity-trend`, { headers }),
          axios.get(`${API}/pipeline-status`, { headers }),
          axios.get(`${API}/followup-health`, { headers }),
          axios.get(`${API}/recent-activities`, { headers }),
          axios.get(`${API}/recent-companies`, { headers }),
        ]);

        setSummary(summaryRes.data.data);
        setActivityTrend(activityTrendRes.data.data);
        setPipelineStatus(pipelineRes.data.data);
        setFollowupHealth(followupRes.data.data);
        setRecentActivities(recentActivitiesRes.data.data);
        setRecentCompanies(recentCompaniesRes.data.data);
      } catch (err) {
        console.error('Staff Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="owner-dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>My Dashboard</h1>
          <span className="status-badge status-info" style={{ textTransform: 'capitalize' }}>
            {user?.role}
          </span>
        </div>
        <p style={{ marginTop: '8px' }}>Personal workspace and performance tracking.</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">My Leads / Companies</div>
          <div className="kpi-value">{summary?.total_leads ?? '—'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">My Customers</div>
          <div className="kpi-value">{summary?.total_customers ?? '—'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">My Activities</div>
          <div className="kpi-value">{summary?.total_activities ?? '—'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">My Orders</div>
          <div className="kpi-value">{summary?.total_orders ?? '—'}</div>
        </div>
      </div>

      {/* Follow-up Health Cards */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '2rem 0 1rem 0' }}>Follow-Up Status</h2>
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="kpi-title">Overdue Follow-ups</div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>{followupHealth?.overdue ?? 0}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-title">Due Today</div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>{followupHealth?.due_today ?? 0}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-title">Upcoming</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{followupHealth?.upcoming ?? 0}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Activity Trend */}
        <div className="chart-card">
          <div className="chart-header">Activity Trend (Last 6 Months)</div>
          {activityTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#activityGradient)" strokeWidth={2} name="Activities" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No activity history found</p>
          )}
        </div>

        {/* Lead Pipeline Status */}
        <div className="chart-card">
          <div className="chart-header">Lead Pipeline Distribution</div>
          {pipelineStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="status" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No pipeline stages registered yet</p>
          )}
        </div>
      </div>

      {/* Tables Row: Recent Companies & Recent Activities */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Recent Companies */}
        <div className="table-card">
          <div className="chart-header">My Recent Companies</div>
          {recentCompanies.length > 0 ? (
            <>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Industry</th>
                    <th>Priority</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded.recentCompanies ? recentCompanies : recentCompanies.slice(0, 5)).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{c.industry}</td>
                      <td>
                        <span className={`status-badge ${
                          c.priority === 'high' ? 'status-danger' : c.priority === 'medium' ? 'status-warning' : 'status-neutral'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(c.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentCompanies.length > 5 && (
                <div 
                  onClick={() => setExpanded(p => ({ ...p, recentCompanies: !p.recentCompanies }))}
                  style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', borderTop: '1px solid var(--border-color)', marginTop: '12px', userSelect: 'none' }}
                >
                  {expanded.recentCompanies ? '▲ Show Less' : `▼ Show More (+${recentCompanies.length - 5} records)`}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No companies assigned to you yet</p>
          )}
        </div>

        {/* Recent Activities */}
        <div className="table-card">
          <div className="chart-header">My Recent Activities</div>
          {recentActivities.length > 0 ? (
            <>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Query</th>
                    <th>Status</th>
                    <th>Follow-up Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded.recentActivities ? recentActivities : recentActivities.slice(0, 5)).map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.company_name}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.query}>
                        {a.query}
                      </td>
                      <td>
                        <span className="status-badge status-info">{a.status || '—'}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {a.next_followup_date ? new Date(a.next_followup_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentActivities.length > 5 && (
                <div 
                  onClick={() => setExpanded(p => ({ ...p, recentActivities: !p.recentActivities }))}
                  style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', borderTop: '1px solid var(--border-color)', marginTop: '12px', userSelect: 'none' }}
                >
                  {expanded.recentActivities ? '▲ Show Less' : `▼ Show More (+${recentActivities.length - 5} records)`}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No activities registered by you yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
