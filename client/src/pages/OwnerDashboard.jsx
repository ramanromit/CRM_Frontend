import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import './OwnerDashboard.css';

const API = `${API_BASE_URL}/api/dashboard/owner`;

const CHART_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const formatCurrency = (val) => {
  if (val == null) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [summary, setSummary] = useState(null);
  const [leadSources, setLeadSources] = useState([]);
  const [conversionRate, setConversionRate] = useState(null);
  const [sourceEffectiveness, setSourceEffectiveness] = useState([]);
  const [pipelineStatus, setPipelineStatus] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [employeePerformance, setEmployeePerformance] = useState([]);
  const [followupHealth, setFollowupHealth] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    employeePerformance: false,
    followupHealth: false,
    recentOrders: false,
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
          summaryRes, leadSourcesRes, conversionRes, sourceEffRes,
          pipelineRes, revenueRes, empPerfRes, followupRes,
          recentOrdersRes, recentActivitiesRes
        ] = await Promise.all([
          axios.get(`${API}/summary`, { headers }),
          isManager ? Promise.resolve({ data: { success: true, data: [] } }) : axios.get(`${API}/lead-sources`, { headers }),
          axios.get(`${API}/conversion-rate`, { headers }),
          isManager ? Promise.resolve({ data: { success: true, data: [] } }) : axios.get(`${API}/source-effectiveness`, { headers }),
          axios.get(`${API}/pipeline-status`, { headers }),
          isManager ? Promise.resolve({ data: { success: true, data: [] } }) : axios.get(`${API}/revenue-trend`, { headers }),
          axios.get(`${API}/employee-performance`, { headers }),
          axios.get(`${API}/followup-health`, { headers }),
          isManager ? Promise.resolve({ data: { success: true, data: [] } }) : axios.get(`${API}/recent-orders`, { headers }),
          axios.get(`${API}/recent-activities`, { headers }),
        ]);

        setSummary(summaryRes.data.data);
        setLeadSources(leadSourcesRes.data.data);
        setConversionRate(conversionRes.data.data);
        setSourceEffectiveness(sourceEffRes.data.data);
        setPipelineStatus(pipelineRes.data.data);
        setRevenueTrend(revenueRes.data.data);
        setEmployeePerformance(empPerfRes.data.data);
        setFollowupHealth(followupRes.data.data);
        setRecentOrders(recentOrdersRes.data.data);
        setRecentActivities(recentActivitiesRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="owner-dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Owner Dashboard</h1>
        <p>Business-level insights and analytics for your CRM.</p>
      </div>

      {/* Section 1: KPI Cards */}
      <div className="kpi-grid">
        {!isManager && (
          <>
            <div className="kpi-card">
              <div className="kpi-title">Total Leads</div>
              <div className="kpi-value">{summary?.total_leads ?? '—'}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Total Customers</div>
              <div className="kpi-value">{summary?.total_customers ?? '—'}</div>
            </div>
          </>
        )}
        <div className="kpi-card">
          <div className="kpi-title">Total Orders</div>
          <div className="kpi-value">{summary?.total_orders ?? '—'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total Assigned Tasks</div>
          <div className="kpi-value">{summary?.total_tasks ?? '—'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Completed Tasks</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{summary?.completed_tasks ?? '—'}</div>
        </div>
        {!isManager && (
          <>
            <div className="kpi-card">
              <div className="kpi-title">Total Revenue</div>
              <div className="kpi-value">{formatCurrency(summary?.total_revenue)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Outstanding Amount</div>
              <div className="kpi-value" style={{ color: '#ef4444' }}>{formatCurrency(summary?.outstanding_amount)}</div>
            </div>
          </>
        )}
      </div>

      {/* Section 3: Conversion Rate Card */}
      {!isManager && conversionRate && (
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card" style={{ gridColumn: 'span 1' }}>
            <div className="kpi-title">Conversion Rate</div>
            <div className="kpi-value" style={{ color: '#10b981' }}>{conversionRate.conversion_rate}%</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {conversionRate.total_customers} customers from {conversionRate.total_leads} leads
            </div>
          </div>
        </div>
      )}

      {/* Charts Row: Pie + Line */}
      {!isManager && (
        <div className="charts-grid">
          {/* Section 2: Lead Source Distribution - Pie */}
          <div className="chart-card">
            <div className="chart-header">Lead Source Distribution</div>
            {leadSources.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ source, count }) => `${source}: ${count}`}
                  >
                    {leadSources.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No data available</p>
            )}
          </div>

          {/* Section 6: Revenue Trend - Line/Area */}
          <div className="chart-card">
            <div className="chart-header">Revenue Trend</div>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No data available</p>
            )}
          </div>
        </div>
      )}

      {/* Charts Row: Pipeline Bar + Source Effectiveness */}
      <div className="charts-grid" style={{ gridTemplateColumns: isManager ? '1fr' : '1fr 1fr' }}>
        {/* Section 5: Pipeline Status - Bar */}
        <div className="chart-card">
          <div className="chart-header">Lead Pipeline Status</div>
          {pipelineStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="status" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No data available</p>
          )}
        </div>

        {/* Section 4: Source Effectiveness - Horizontal Bar Cards */}
        {!isManager && (
          <div className="chart-card">
            <div className="chart-header">Source Effectiveness</div>
            {sourceEffectiveness.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sourceEffectiveness.map((s, i) => (
                  <div key={i} style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.source}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {s.total_leads} leads → {s.total_customers} customers
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '16px',
                      color: s.conversion_rate >= 50 ? '#10b981' : s.conversion_rate >= 25 ? '#f59e0b' : '#ef4444'
                    }}>
                      {s.conversion_rate}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No data available</p>
            )}
          </div>
        )}
      </div>

      {/* Section 7: Employee Performance Table */}
      <div className="tables-grid">
        <div className="table-card">
          <div className="chart-header">Employee Performance</div>
          {employeePerformance.length > 0 ? (
            <>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Code</th>
                    <th>Assigned Leads</th>
                    <th>Customers</th>
                    <th>Orders</th>
                    {!isManager && <th>Revenue</th>}
                  </tr>
                </thead>
                <tbody>
                  {(expanded.employeePerformance ? employeePerformance : employeePerformance.slice(0, 5)).map((emp) => (
                    <tr key={emp.employee_id}>
                      <td style={{ fontWeight: 500 }}>{emp.employee_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{emp.employee_code}</td>
                      <td>{emp.assigned_leads}</td>
                      <td>{emp.customers}</td>
                      <td>{emp.orders}</td>
                      {!isManager && <td style={{ fontWeight: 600 }}>{formatCurrency(emp.revenue)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {employeePerformance.length > 5 && (
                <div 
                  onClick={() => setExpanded(p => ({ ...p, employeePerformance: !p.employeePerformance }))}
                  style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', borderTop: '1px solid var(--border-color)', marginTop: '12px', userSelect: 'none' }}
                >
                  {expanded.employeePerformance ? '▲ Show Less' : `▼ Show More (+${employeePerformance.length - 5} records)`}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No data available</p>
          )}
        </div>
      </div>

      {/* Section 8: Follow-Up Health Table */}
      <div className="tables-grid">
        <div className="table-card">
          <div className="chart-header">Follow-Up Health</div>
          {followupHealth.length > 0 ? (
            <>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Overdue</th>
                    <th>Due Today</th>
                    <th>Upcoming</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded.followupHealth ? followupHealth : followupHealth.slice(0, 5)).map((emp) => (
                    <tr key={emp.employee_id}>
                      <td style={{ fontWeight: 500 }}>{emp.employee_name}</td>
                      <td>
                        <span className={`status-badge ${emp.overdue > 0 ? 'status-danger' : 'status-neutral'}`}>
                          {emp.overdue}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${emp.due_today > 0 ? 'status-warning' : 'status-neutral'}`}>
                          {emp.due_today}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge status-success">
                          {emp.upcoming}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {followupHealth.length > 5 && (
                <div 
                  onClick={() => setExpanded(p => ({ ...p, followupHealth: !p.followupHealth }))}
                  style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', borderTop: '1px solid var(--border-color)', marginTop: '12px', userSelect: 'none' }}
                >
                  {expanded.followupHealth ? '▲ Show Less' : `▼ Show More (+${followupHealth.length - 5} records)`}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No data available</p>
          )}
        </div>
      </div>

      {/* Section 9 & 10: Recent Orders and Activities side by side */}
      <div className="charts-grid" style={{ gridTemplateColumns: isManager ? '1fr' : '1fr 1fr' }}>
        {/* Recent Orders */}
        {!isManager && (
          <div className="table-card">
            <div className="chart-header">Recent Orders</div>
            {recentOrders.length > 0 ? (
              <>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Order Code</th>
                      <th>Company</th>
                      <th>Value</th>
                      <th>Due</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(expanded.recentOrders ? recentOrders : recentOrders.slice(0, 5)).map((o) => (
                      <tr key={o.order_id}>
                        <td style={{ fontWeight: 500 }}>{o.order_code}</td>
                        <td>{o.customer_name}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(o.order_value)}</td>
                        <td style={{ color: o.payment_due > 0 ? '#ef4444' : '#10b981' }}>
                          {formatCurrency(o.payment_due)}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          {o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentOrders.length > 5 && (
                  <div 
                    onClick={() => setExpanded(p => ({ ...p, recentOrders: !p.recentOrders }))}
                    style={{ textAlign: 'center', padding: '12px 0 0 0', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', borderTop: '1px solid var(--border-color)', marginTop: '12px', userSelect: 'none' }}
                  >
                    {expanded.recentOrders ? '▲ Show Less' : `▼ Show More (+${recentOrders.length - 5} records)`}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No orders yet</p>
            )}
          </div>
        )}

        {/* Recent Activities */}
        <div className="table-card">
          <div className="chart-header">Recent Activities</div>
          {recentActivities.length > 0 ? (
            <>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Activity</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded.recentActivities ? recentActivities : recentActivities.slice(0, 5)).map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.company_name}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.query}
                      </td>
                      <td>
                        <span className="status-badge status-info">{a.status || '—'}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{a.owner_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {a.activity_date ? new Date(a.activity_date).toLocaleDateString('en-IN') : '—'}
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
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No activities yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
