import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import './Auth.css';
import { useAuth } from '../context/AuthContext';

const ViewActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('all'); // 'all', '7days', '30days'
  const [filterType, setFilterType] = useState('all'); // 'all', 'client', 'customer'
  const [viewMode, setViewMode] = useState('client'); // 'client', 'employee'
  
  const [sortField, setSortField] = useState('activity_date');
  const [sortDir, setSortDir] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const headers = { Authorization: `Bearer ${token}` };

        const actRes = await axios.get(`${API_BASE_URL}/api/activity/list`, { headers });
        if (actRes.data.success) setActivities(actRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const formatDaysAgo = (dateStr) => {
    if (!dateStr) return '—';
    const activityDate = new Date(dateStr);
    const today = new Date();
    
    activityDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today - activityDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 0) return 'In the future';
    return `${diffDays} days ago`;
  };

  // Base filtering
  let filtered = activities;

  // Search filter
  if (searchQuery.trim() !== '') {
    const lowerQ = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      (a.company_name || '').toLowerCase().includes(lowerQ) ||
      (a.query || '').toLowerCase().includes(lowerQ) ||
      (a.description || '').toLowerCase().includes(lowerQ) ||
      (a.owner_name || '').toLowerCase().includes(lowerQ)
    );
  }

  // Type filter
  if (filterType !== 'all') {
    filtered = filtered.filter((a) => a.client_type === filterType);
  }

  // Date filter
  if (filterDate !== 'all') {
    const now = new Date();
    const threshold = new Date();
    if (filterDate === '7days') {
      threshold.setDate(now.getDate() - 7);
    } else if (filterDate === '30days') {
      threshold.setDate(now.getDate() - 30);
    }
    filtered = filtered.filter(a => new Date(a.activity_date) >= threshold);
  }

  const isEmployeeView = viewMode === 'employee' && (user?.role === 'owner' || user?.role === 'manager');
  const groupKey = isEmployeeView ? 'owner_id' : 'company_id';

  const latestMap = new Map();
  const countMap = new Map();
  
  filtered.forEach(a => {
    const key = a[groupKey] || 'unknown';
    // Count activities
    countMap.set(key, (countMap.get(key) || 0) + 1);

    // Track latest activity
    if (!latestMap.has(key)) {
      latestMap.set(key, a);
    } else {
      const current = latestMap.get(key);
      if (new Date(a.activity_date) > new Date(current.activity_date)) {
        latestMap.set(key, a);
      }
    }
  });
  
  const groupedFiltered = Array.from(latestMap.values()).map(a => ({
    ...a,
    total_activities: countMap.get(a[groupKey] || 'unknown') || 1
  }));

  // Sort
  const sorted = [...groupedFiltered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    if (sortField === 'activity_date') {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    } else if (sortField === 'total_activities') {
      valA = valA || 0;
      valB = valB || 0;
    } else if (sortField === 'company') {
      valA = (a.company_name || '').toLowerCase();
      valB = (b.company_name || '').toLowerCase();
    } else if (sortField === 'client_type') {
      valA = (a.client_type || '').toLowerCase();
      valB = (b.client_type || '').toLowerCase();
    } else if (sortField === 'owner_name') {
      valA = (a.owner_name || '').toLowerCase();
      valB = (b.owner_name || '').toLowerCase();
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }
    
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDate('all');
    setFilterType('all');
  };

  const thStyle = {
    padding: '16px 20px',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-sidebar)',
  };

  const tdStyle = { 
    padding: '20px', 
    fontSize: '14px',
    borderBottom: '1px solid var(--border-color)',
  };

  const typeBadge = (type) => {
    const isCustomer = type === 'customer';
    return (
      <span style={{
        display: 'inline-flex',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: isCustomer ? 'var(--primary)' : '#E0E0E0',
        color: isCustomer ? 'white' : 'grey',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {type}
      </span>
    );
  };

  return (
    <div style={{ padding: '0 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '32px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Activity Log</h1>
          <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Review and manage recent interactions across your agricultural network.
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/add-activity')}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'background 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px rgba(46, 125, 50, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>⊕</span> NEW ACTIVITY
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search by client, employee or activity subject..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>

        {/* Date Filter */}
        <div style={{ flex: '0 1 auto' }}>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="all">Date: All Time</option>
            <option value="30days">Last 30 Days</option>
            <option value="7days">Last 7 Days</option>
          </select>
        </div>

        {/* Type Filter */}
        <div style={{ flex: '0 1 auto' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="all">Type: All</option>
            <option value="client">Client</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {/* View Mode Switch for Owner/Manager */}
        {(user?.role === 'owner' || user?.role === 'manager') && (
          <div style={{ flex: '0 1 auto', display: 'flex', background: 'var(--bg-input)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('client')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                background: viewMode === 'client' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'client' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: viewMode === 'client' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              By Client
            </button>
            <button
              onClick={() => setViewMode('employee')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                background: viewMode === 'employee' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'employee' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: viewMode === 'employee' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              By Employee
            </button>
          </div>
        )}

        {/* Clear Filters */}
        {(searchQuery || filterDate !== 'all' || filterType !== 'all') && (
          <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={clearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#f44336',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                padding: '8px 12px',
              }}
            >
              Clear Filters ✕
            </button>
          </div>
        )}
      </div>

      {/* Content Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading activities...</p>
        </div>
      ) : error ? (
        <div style={{ color: '#d32f2f', background: '#ffebee', padding: '16px 20px', borderRadius: '8px', fontSize: '14px' }}>
          ⚠ {error}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontWeight: 500, marginBottom: '8px', fontSize: '18px' }}>No activities found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Try adjusting your filters or creating a new activity.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  {isEmployeeView ? (
                    <>
                      <th style={thStyle} onClick={() => handleSort('owner_name')}>EMPLOYEE</th>
                      <th style={thStyle} onClick={() => handleSort('query')}>LATEST ACTIVITY</th>
                      <th style={thStyle} onClick={() => handleSort('company')}>INTERACTED WITH</th>
                      <th style={thStyle} onClick={() => handleSort('activity_date')}>DATE</th>
                      <th style={{ ...thStyle, cursor: 'default' }}>ATTACHMENT</th>
                      <th style={thStyle} onClick={() => handleSort('total_activities')}>TOTAL ACTS</th>
                    </>
                  ) : (
                    <>
                      <th style={thStyle} onClick={() => handleSort('company')}>COMPANY</th>
                      <th style={thStyle} onClick={() => handleSort('client_type')}>TYPE</th>
                      <th style={thStyle} onClick={() => handleSort('query')}>LATEST ACTIVITY</th>
                      <th style={thStyle} onClick={() => handleSort('activity_date')}>DATE</th>
                      <th style={{ ...thStyle, cursor: 'default' }}>ATTACHMENT</th>
                      <th style={thStyle} onClick={() => handleSort('total_activities')}>TOTAL ACTS</th>
                      <th style={thStyle} onClick={() => handleSort('owner_name')}>INTERACTED BY</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((activity) => (
                  <tr
                    key={activity.id}
                    onClick={() => navigate(`/activity/company/${activity.company_id}`)}
                    style={{
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-card)',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  >
                    {isEmployeeView ? (
                      <>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              backgroundColor: 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: 600, color: 'white'
                            }}>
                              {(activity.owner_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '15px' }}>
                              {activity.owner_name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{activity.query}</span>
                          {activity.description && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {activity.description}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>{activity.company_name}</span>
                            {typeBadge(activity.client_type)}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDaysAgo(activity.activity_date)}</td>
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          {activity.attachment ? (
                            <a href={`${API_BASE_URL}${activity.attachment.file_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }} title={activity.attachment.file_name}>
                              📄 View
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>N/A</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(46,125,50,0.1)', color: 'var(--primary)', fontWeight: 700, borderRadius: '50%', width: '28px', height: '28px', fontSize: '12px' }}>
                            {activity.total_activities}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                              🏢
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '15px' }}>{activity.company_name}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          {typeBadge(activity.client_type)}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {activity.query}
                          </span>
                          {activity.description && (
                            <div style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                              maxWidth: '250px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {activity.description}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                          {formatDaysAgo(activity.activity_date)}
                        </td>
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          {activity.attachment ? (
                            <a href={`${API_BASE_URL}${activity.attachment.file_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }} title={activity.attachment.file_name}>
                              📄 View
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>N/A</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(46,125,50,0.1)', color: 'var(--primary)',
                            fontWeight: 700, borderRadius: '50%', width: '28px', height: '28px', fontSize: '12px'
                          }}>
                            {activity.total_activities}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              backgroundColor: 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 600, color: 'white'
                            }}>
                              {(activity.owner_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>
                              {activity.owner_name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing 1 to {sorted.length} interactions</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>&lt;</button>
              <button style={{ border: 'none', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>1</button>
              <button style={{ border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>2</button>
              <button style={{ border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>3</button>
              <button style={{ border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>&gt;</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewActivities;
