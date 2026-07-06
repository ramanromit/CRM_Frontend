import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarIcon, 
  BellIcon, 
  InboxIcon, 
  SunIcon, 
  DownloadIcon, 
  FileIcon,
  ClipboardIcon,
  CheckCircleIcon
} from './Icons';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // --- Dismissed notifications helpers (localStorage-based) ---
  const getDismissedKey = () => `crm_dismissed_notifs_${user?.id || 'unknown'}`;

  const getDismissedIds = () => {
    try {
      const raw = localStorage.getItem(getDismissedKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Auto-expire dismissed list after 24 hours
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(getDismissedKey());
        return [];
      }
      return parsed.ids || [];
    } catch { return []; }
  };

  const saveDismissedIds = (ids) => {
    localStorage.setItem(getDismissedKey(), JSON.stringify({
      ids,
      expiry: Date.now() + 24 * 60 * 60 * 1000 // expires in 24h
    }));
  };

  const dismissAllNotifications = () => {
    const currentIds = notifications.map(n => String(n.id));
    const existing = getDismissedIds();
    const merged = [...new Set([...existing, ...currentIds])];
    saveDismissedIds(merged);
    setNotifications([]);
  };
  // --- End dismissed helpers ---

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const fetchCalendarEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/calendar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCalendarEvents(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching calendar events:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchCalendarEvents();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchCalendarEvents();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        {/* Top Header / Search Area */}
        <header style={{
          height: '70px',
          backgroundColor: 'var(--bg-main)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Calendar Icon */}
            <div 
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => {
                setCalendarOpen(true);
                fetchCalendarEvents();
              }}
            >
              <CalendarIcon 
                size={20}
                style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} 
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} 
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              />
            </div>

            <div 
              ref={notifRef}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <BellIcon 
                size={20}
                style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} 
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} 
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'} 
              />

              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '10px',
                  height: '14px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                  {notifications.length}
                </span>
              )}
              
              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '-10px',
                  width: '320px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  animation: 'slideUp 0.2s ease',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>Notifications ({notifications.length})</h4>
                    <span 
                      onClick={(e) => { e.stopPropagation(); dismissAllNotifications(); }}
                      style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer' }}
                    >
                      Clear all
                    </span>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <InboxIcon size={32} style={{ marginBottom: '8px', opacity: 0.5, color: 'var(--text-muted)' }} />
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>No new notifications</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>You're all caught up!</div>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.map(n => {
                        let icon = <BellIcon size={16} />;
                        let iconBg = 'rgba(79, 70, 229, 0.1)';
                        if (n.type === 'followup') {
                          icon = <CalendarIcon size={16} style={{ color: '#f59e0b' }} />;
                          iconBg = 'rgba(245, 158, 11, 0.1)';
                        } else if (n.type === 'quotation_request') {
                          icon = <DownloadIcon size={16} style={{ color: '#10b981' }} />;
                          iconBg = 'rgba(16, 185, 129, 0.1)';
                        } else if (n.type === 'quotation_update') {
                          icon = <FileIcon size={16} style={{ color: '#3b82f6' }} />;
                          iconBg = 'rgba(59, 130, 246, 0.1)';
                        } else if (n.type === 'task') {
                          icon = <ClipboardIcon size={16} style={{ color: '#8b5cf6' }} />;
                          iconBg = 'rgba(139, 92, 246, 0.1)';
                        } else if (n.type === 'task_completed') {
                          icon = <CheckCircleIcon size={16} style={{ color: '#10b981' }} />;
                          iconBg = 'rgba(16, 185, 129, 0.1)';
                        }
                        
                        return (
                          <div 
                            key={n.id}
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate(n.link);
                            }}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'flex-start',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              padding: '8px',
                              borderRadius: '8px',
                              backgroundColor: iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px'
                            }}>
                              {icon}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                                {n.title}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {n.message}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {new Date(n.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div 
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate(user?.role === 'accounts' ? '/quotations' : '/activities');
                    }}
                    style={{ padding: '12px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', backgroundColor: 'var(--bg-main)' }}
                  >
                    View all {user?.role === 'accounts' ? 'quotations' : 'activities'}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{user ? (user.full_name || user.email) : 'Loading...'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user ? user.role : ''}</div>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--border-color)',
                overflow: 'hidden'
              }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                  {user ? (user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()) : 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '32px', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>

      {calendarOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '650px',
            maxWidth: '95%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            padding: '24px',
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Employee Calendar View</h3>
              <button 
                onClick={() => setCalendarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Calendar Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              
              {/* Left Side: Month Grid */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button 
                    onClick={prevMonth}
                    style={{
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ◀ Prev
                  </button>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={nextMonth}
                    style={{
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Next ▶
                  </button>
                </div>

                {/* Weekdays Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 500, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => <div key={w}>{w}</div>)}
                </div>

                {/* Days Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {(() => {
                    const daysInMonth = getDaysInMonth(currentMonth);
                    const firstDayIndex = getFirstDayOfMonth(currentMonth);
                    const cells = [];
                    
                    // Spacer cells
                    for (let i = 0; i < firstDayIndex; i++) {
                      cells.push(<div key={`empty-${i}`} style={{ height: '36px' }}></div>);
                    }
                    
                    // Month days
                    for (let d = 1; d <= daysInMonth; d++) {
                      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                      const isToday = isSameDay(cellDate, new Date());
                      const isSelected = isSameDay(cellDate, selectedDate);
                      
                      // Check for events
                      const dayEvents = calendarEvents.filter(e => isSameDay(e.date, cellDate));
                      const hasFollowup = dayEvents.some(e => e.type === 'followup');
                      const hasExpiry = dayEvents.some(e => e.type === 'quotation_expiry');
                      const hasOrder = dayEvents.some(e => e.type === 'order');
                      const hasTask = dayEvents.some(e => e.type === 'task');

                      cells.push(
                        <div 
                          key={`day-${d}`}
                          onClick={() => setSelectedDate(cellDate)}
                          style={{
                            height: '36px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: isToday || isSelected ? 'bold' : 'normal',
                            border: isToday ? '1.5px solid var(--primary)' : '1px solid transparent',
                            backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                            color: isSelected ? 'white' : 'var(--text-main)',
                            position: 'relative',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {d}
                          {/* Event Indicators */}
                          <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '2px' }}>
                            {hasFollowup && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>}
                            {hasExpiry && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>}
                            {hasOrder && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>}
                            {hasTask && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></span>}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>

              {/* Right Side: Selected Date Details */}
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', height: '280px', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Events for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </h4>
                
                {(() => {
                  const filtered = calendarEvents.filter(e => isSameDay(e.date, selectedDate));
                  if (filtered.length === 0) {
                    return (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <SunIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        No events scheduled
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filtered.map(ev => {
                        let typeColor = '#f59e0b';
                        let typeLabel = 'Follow-up';
                        if (ev.type === 'quotation_expiry') {
                          typeColor = '#3b82f6';
                          typeLabel = 'Quotation Expiry';
                        } else if (ev.type === 'order') {
                          typeColor = '#10b981';
                          typeLabel = 'Order';
                        } else if (ev.type === 'task') {
                          typeColor = '#8b5cf6';
                          typeLabel = 'Task Due';
                        }

                        return (
                          <div 
                            key={ev.id}
                            onClick={() => {
                              setCalendarOpen(false);
                              navigate(ev.link);
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: `1px solid var(--border-color)`,
                              borderLeft: `4px solid ${typeColor}`,
                              cursor: 'pointer',
                              backgroundColor: 'var(--bg-sidebar)',
                              transition: 'transform 0.15s ease',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: typeColor, textTransform: 'uppercase' }}>
                                {typeLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                              {ev.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {ev.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Layout;
