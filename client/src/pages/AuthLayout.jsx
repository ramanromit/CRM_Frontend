import React from 'react';
import './Auth.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-image-panel">
          <div className="auth-image-content">
            <div className="auth-header">
                <div className="auth-logo">
                    {/* SVG placeholder for AMU logo */}
                    <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 20L15 0H25L35 20H28L20 4L12 20H5ZM40 20V0H48V16H58V20H40Z" fill="white"/>
                    </svg>
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
