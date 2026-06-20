import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'user';

  const allNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '⊞', roles: ['developer', 'owner', 'manager', 'sales', 'marketing', 'accounts', 'user'] },
    { name: 'Activities', path: '/activities', icon: '📅', roles: ['developer', 'owner', 'manager', 'sales', 'marketing', 'accounts'] },
    { name: 'Quotations', path: '/quotations', icon: '📋', roles: ['developer', 'owner', 'manager', 'sales', 'marketing', 'accounts'] },
    { name: 'Customers', path: '/customers', icon: '👥', roles: ['developer', 'owner', 'manager', 'sales', 'accounts'] },
    { name: 'Orders', path: '/orders', icon: '📦', roles: ['developer', 'owner', 'manager', 'sales'] },
    { name: 'Companies', path: '/clients', icon: '🏢', roles: ['developer', 'owner', 'manager', 'sales', 'marketing'] },
    { name: 'Employees', path: '/employees', icon: '👤', roles: ['developer', 'owner', 'manager'] },
  ];

  const navLinks = allNavLinks.filter(link => link.roles.includes(role));
  const showAddLead = ['developer', 'owner', 'manager', 'sales', 'marketing'].includes(role);

  return (
    <div style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      {/* Logo Area */}
      <div style={{ padding: '24px 24px 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            🌱
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '-0.5px', color: 'var(--primary)' }}>AgriCRM</h2>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Agri-Business CRM</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navLinks.map((link) => (
            <li key={link.name}>
              <NavLink
                to={link.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text-main)',
                  backgroundColor: isActive ? 'var(--tertiary)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                })}
              >
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Add Lead Button */}
        {showAddLead && (
          <div style={{ marginTop: '32px', padding: '0 4px' }}>
            <button
              onClick={() => navigate('/add-company')}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              + Add New Lead
            </button>
          </div>
        )}
      </nav>

      {/* Footer Nav */}
      <div style={{ padding: '24px 16px', borderTop: '1px solid var(--border-color)' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                e.currentTarget.style.color = '#d32f2f';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <span style={{ fontSize: '16px' }}>➜</span> Sign Out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
