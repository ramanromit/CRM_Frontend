import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', color: 'var(--text-main)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.5px' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '15px' }}>Welcome to AgriCRM. Use the sidebar to navigate through your CRM modules.</p>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Activities</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>—</div>
          <div style={{ fontSize: '13px', color: 'var(--secondary)', marginTop: '4px' }}>View all →</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Companies</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>—</div>
          <div style={{ fontSize: '13px', color: 'var(--secondary)', marginTop: '4px' }}>View all →</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Customers</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>—</div>
          <div style={{ fontSize: '13px', color: 'var(--secondary)', marginTop: '4px' }}>View all →</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Employees</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>—</div>
          <div style={{ fontSize: '13px', color: 'var(--secondary)', marginTop: '4px' }}>View all →</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <h2 style={{ marginTop: 0, fontWeight: 600, fontSize: '18px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button 
            onClick={() => navigate('/add-company')} 
            style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            + Add Company
          </button>
          <button 
            onClick={() => navigate('/add-activity')} 
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
          >
            + Register Activity
          </button>
          <button 
            onClick={() => navigate('/add-customer')} 
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
          >
            + Add Customer
          </button>
          <button 
            onClick={() => navigate('/add-employee')} 
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
          >
            + Add Employee
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
