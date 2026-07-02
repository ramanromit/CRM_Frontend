import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useAuth } from '../context/AuthContext';
import { SearchIcon, ClipboardIcon, CheckCircleIcon, ClockIcon, EditIcon } from '../components/Icons';
import './Auth.css';

const ViewAssignments = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);

  // Complete modal
  const [completeModal, setCompleteModal] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  // Detail modal
  const [detailTask, setDetailTask] = useState(null);

  const isManager = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'developer';

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const res = await axios.get(`${API_BASE_URL}/api/task/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setTasks(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isManager) {
      const fetchEmployees = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_BASE_URL}/api/employee/list`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) setEmployees(res.data.data);
        } catch (err) {
          console.error('Failed to load employees', err);
        }
      };
      fetchEmployees();
    }
  }, [navigate]);

  const handleStatusUpdate = async (taskId, newStatus, notes) => {
    try {
      setCompleting(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/task/status/${taskId}`, {
        status: newStatus,
        completion_notes: notes || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompleteModal(null);
      setCompletionNotes('');
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setCompleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Completed' || status === 'Cancelled') return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  // --- Filtering ---
  let filtered = tasks;

  // Tab filter
  if (activeTab !== 'all') {
    filtered = filtered.filter(t => t.status === activeTab);
  }

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.company_name || '').toLowerCase().includes(q) ||
      (t.assigner_name || '').toLowerCase().includes(q) ||
      (t.assignee_name || '').toLowerCase().includes(q)
    );
  }

  // Employee filter (manager only)
  if (filterEmployee !== 'all') {
    filtered = filtered.filter(t => t.assigned_to === filterEmployee);
  }

  // Counts
  const counts = {
    all: tasks.length,
    Pending: tasks.filter(t => t.status === 'Pending').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    Completed: tasks.filter(t => t.status === 'Completed').length,
  };

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'Pending', label: 'Pending', count: counts.Pending },
    { key: 'In Progress', label: 'In Progress', count: counts['In Progress'] },
    { key: 'Completed', label: 'Completed', count: counts.Completed },
  ];

  const priorityBadge = (priority) => {
    const colors = {
      High: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
      Medium: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
      Low: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
    };
    const c = colors[priority] || colors.Medium;
    return (
      <span style={{
        display: 'inline-flex', padding: '4px 10px', borderRadius: '4px',
        fontSize: '11px', fontWeight: 700, backgroundColor: c.bg, color: c.color,
        border: `1px solid ${c.border}`, textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        {priority}
      </span>
    );
  };

  const statusBadge = (status) => {
    const colors = {
      Pending: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
      'In Progress': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
      Completed: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
      Cancelled: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    };
    const c = colors[status] || colors.Pending;
    return (
      <span style={{
        display: 'inline-flex', padding: '4px 10px', borderRadius: '4px',
        fontSize: '11px', fontWeight: 700, backgroundColor: c.bg, color: c.color,
        border: `1px solid ${c.border}`, textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        {status}
      </span>
    );
  };

  const avatarInitial = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
    padding: '16px 20px',
    fontSize: '14px',
    borderBottom: '1px solid var(--border-color)',
  };

  return (
    <div style={{ padding: '0 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: '32px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Assignments</h1>
          <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            {isManager ? 'Manage and track tasks assigned across your team.' : 'View and complete tasks assigned to you.'}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => navigate('/add-assignment')}
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
            <span style={{ fontSize: '18px', lineHeight: 1 }}>⊕</span> NEW TASK
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {tabs.map(tab => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'var(--bg-card)',
              border: `1px solid ${activeTab === tab.key ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: activeTab === tab.key ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === tab.key ? '0 8px 24px rgba(46, 125, 50, 0.25)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
            onMouseOver={(e) => { if (activeTab !== tab.key) e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseOut={(e) => { if (activeTab !== tab.key) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <div style={{ fontSize: '28px', fontWeight: 700, color: activeTab === tab.key ? 'white' : 'var(--text-main)', marginBottom: '4px' }}>
              {tab.count}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: activeTab === tab.key ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {tab.label}
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search tasks by title, company, or employee..."
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
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
            <SearchIcon size={16} />
          </span>
        </div>

        {/* Employee filter (managers only) */}
        {isManager && (
          <div style={{ flex: '0 1 auto' }}>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading assignments...</p>
        </div>
      ) : error ? (
        <div style={{ color: '#d32f2f', background: '#ffebee', padding: '16px 20px', borderRadius: '8px', fontSize: '14px' }}>
          ⚠ {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          <ClipboardIcon size={48} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '16px' }} />
          <h3 style={{ fontWeight: 500, marginBottom: '8px', fontSize: '18px', color: 'var(--text-main)' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {activeTab !== 'all' ? `No ${activeTab.toLowerCase()} tasks. Try a different filter.` : 'No tasks have been assigned yet.'}
          </p>
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
                  <th style={thStyle}>TASK</th>
                  <th style={thStyle}>COMPANY</th>
                  <th style={thStyle}>PRIORITY</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>DUE DATE</th>
                  {isManager && <th style={thStyle}>ASSIGNED TO</th>}
                  <th style={thStyle}>ASSIGNED BY</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => (
                  <tr
                    key={task.id}
                    style={{ transition: 'background 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setDetailTask(task)}
                  >
                    {/* Task title + description */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', marginBottom: '2px' }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      )}
                    </td>

                    {/* Company */}
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-main)' }}>
                        {task.company_name || '—'}
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={tdStyle}>
                      {priorityBadge(task.priority)}
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      {statusBadge(task.status)}
                    </td>

                    {/* Due Date */}
                    <td style={tdStyle}>
                      <span style={{
                        color: isOverdue(task.due_date, task.status) ? '#ef4444' : 'var(--text-muted)',
                        fontWeight: isOverdue(task.due_date, task.status) ? 600 : 400,
                        fontSize: '13px'
                      }}>
                        {task.due_date ? formatDate(task.due_date) : '—'}
                        {isOverdue(task.due_date, task.status) && (
                          <span style={{ display: 'block', fontSize: '10px', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>OVERDUE</span>
                        )}
                      </span>
                    </td>

                    {/* Assigned To (managers only) */}
                    {isManager && (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 600, color: 'white', flexShrink: 0
                          }}>
                            {avatarInitial(task.assignee_name)}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-main)' }}>
                            {task.assignee_name}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Assigned By */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 600, color: 'white', flexShrink: 0
                        }}>
                          {avatarInitial(task.assigner_name)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>
                          {task.assigner_name}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {task.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                            title="Start Task"
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#3b82f6',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                          >
                            <ClockIcon size={12} /> Start
                          </button>
                        )}
                        {(task.status === 'Pending' || task.status === 'In Progress') && (
                          <button
                            onClick={() => { setCompleteModal(task); setCompletionNotes(''); }}
                            title="Mark Complete"
                            style={{
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#22c55e',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'; }}
                          >
                            <CheckCircleIcon size={12} /> Done
                          </button>
                        )}
                        {task.status === 'Completed' && (
                          <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircleIcon size={14} /> Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {filtered.length} of {tasks.length} tasks</span>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {completeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setCompleteModal(null)}>
          <div style={{
            width: '480px', maxWidth: '95%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            padding: '28px',
            color: 'var(--text-main)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CheckCircleIcon size={20} style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Complete Task</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{completeModal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setCompleteModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
              >✕</button>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                Completion Notes (optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe what was done..."
                style={{
                  width: '100%', minHeight: '100px', resize: 'vertical',
                  backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', color: 'var(--text-main)', padding: '12px',
                  fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCompleteModal(null)}
                style={{
                  padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >Cancel</button>
              <button
                onClick={() => handleStatusUpdate(completeModal.id, 'Completed', completionNotes)}
                disabled={completing}
                style={{
                  padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer',
                  opacity: completing ? 0.6 : 1, transition: 'all 0.2s ease'
                }}
              >
                {completing ? 'Completing...' : 'Mark as Completed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {detailTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setDetailTask(null)}>
          <div style={{
            width: '580px', maxWidth: '95%', maxHeight: '85vh', overflowY: 'auto',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            padding: '28px',
            color: 'var(--text-main)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {priorityBadge(detailTask.priority)}
                  {statusBadge(detailTask.status)}
                </div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 600, lineHeight: 1.3 }}>{detailTask.title}</h2>
              </div>
              <button
                onClick={() => setDetailTask(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer', padding: '4px', marginLeft: '16px' }}
              >✕</button>
            </div>

            {/* Description */}
            {detailTask.description && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Description</div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)' }}>{detailTask.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Company */}
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Company</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{detailTask.company_name || '—'}</div>
              </div>

              {/* Due Date */}
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Due Date</div>
                <div style={{
                  fontSize: '14px', fontWeight: 500,
                  color: isOverdue(detailTask.due_date, detailTask.status) ? '#ef4444' : 'var(--text-main)'
                }}>
                  {detailTask.due_date ? formatDate(detailTask.due_date) : '—'}
                  {isOverdue(detailTask.due_date, detailTask.status) && <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>OVERDUE</span>}
                </div>
              </div>

              {/* Assigned By */}
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Assigned By</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'white' }}>
                    {avatarInitial(detailTask.assigner_name)}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{detailTask.assigner_name}</span>
                </div>
              </div>

              {/* Assigned To */}
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Assigned To</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'white' }}>
                    {avatarInitial(detailTask.assignee_name)}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{detailTask.assignee_name}</span>
                </div>
              </div>

              {/* Created At */}
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Created</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{formatDate(detailTask.created_at)}</div>
              </div>

              {/* Completed At */}
              {detailTask.status === 'Completed' && (
                <div style={{ padding: '14px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Completed At</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#22c55e' }}>{formatDate(detailTask.completed_at)}</div>
                </div>
              )}
            </div>

            {/* Completion Notes */}
            {detailTask.completion_notes && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Completion Notes</div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)' }}>{detailTask.completion_notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            {(detailTask.status === 'Pending' || detailTask.status === 'In Progress') && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                {detailTask.status === 'Pending' && (
                  <button
                    onClick={() => { handleStatusUpdate(detailTask.id, 'In Progress'); setDetailTask(null); }}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                      border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <ClockIcon size={14} /> Start Task
                  </button>
                )}
                <button
                  onClick={() => { setDetailTask(null); setCompleteModal(detailTask); setCompletionNotes(''); }}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <CheckCircleIcon size={14} /> Mark Complete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAssignments;
