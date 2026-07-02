import React from 'react';
import './Auth.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-image-panel">
          <div className="auth-image-content">
            <div className="auth-header">
                <div className="auth-logo" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/favicon.svg" alt="SeminaAgro Logo" style={{ height: '50px', width: 'auto', display: 'block' }} />
                </div>
                <button className="back-btn">Back to website &rarr;</button>
            </div>
            <div className="auth-image-footer">

                <div className="carousel-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot active"></span>
                </div>
            </div>
          </div>
        </div>
        <div className="auth-form-panel">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
