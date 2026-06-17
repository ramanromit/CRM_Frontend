import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef(null);

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
          <div style={{ flex: 1, maxWidth: '600px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search activities, companies, or logs..."
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 36px',
                  borderRadius: '20px',
                  border: '1px solid transparent',
                  backgroundColor: 'var(--bg-sidebar)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  outline: 'none',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div 
              ref={notifRef}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <span style={{ fontSize: '20px', color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>🔔</span>
              <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#d32f2f', borderRadius: '50%' }}></span>
              
              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '-10px',
                  width: '300px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  zIndex: 100,
                  animation: 'slideUp 0.2s ease',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>Notifications</h4>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer' }}>Mark all as read</span>
                  </div>
                  <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }}>📭</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>No new notifications</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>You're all caught up!</div>
                  </div>
                  <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', backgroundColor: 'var(--bg-main)' }}>
                    View past notifications
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
    </div>
  );
};

export default Layout;
