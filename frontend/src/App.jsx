import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FarmerPortal from './pages/FarmerPortal';
import Marketplace from './pages/Marketplace';
import './pages/Login.css';
import './pages/Dashboard.css';
import './pages/FarmerPortal.css';
import './pages/Marketplace.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('farmerportal'); // 'dashboard' | 'farmerportal' | 'marketplace'

  if (!currentUser) {
    return <Login onLoginSuccess={(u) => {
      setCurrentUser(u);
      setCurrentPage(u.role === 'admin' ? 'dashboard' : 'farmerportal');
    }} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', fontFamily: 'sans-serif' }}>
      {/* Top Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1.5rem',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>🌱 AP Microclimate</span>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentPage('dashboard')}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: currentPage === 'dashboard' ? '#059669' : 'transparent',
                  color: currentPage === 'dashboard' ? '#fff' : '#94a3b8'
                }}
              >
                Admin Queue
              </button>
            )}

            <button
              onClick={() => setCurrentPage('farmerportal')}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                background: currentPage === 'farmerportal' ? '#059669' : 'transparent',
                color: currentPage === 'farmerportal' ? '#fff' : '#94a3b8'
              }}
            >
              Weather Downscaler
            </button>

            <button
              onClick={() => setCurrentPage('marketplace')}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                background: currentPage === 'marketplace' ? '#059669' : 'transparent',
                color: currentPage === 'marketplace' ? '#fff' : '#94a3b8'
              }}
            >
              Mandi Marketplace
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {currentUser.name} (<strong style={{ color: '#34d399' }}>{currentUser.role}</strong>)
          </span>
          <button
            onClick={() => setCurrentUser(null)}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Page Routing */}
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {currentPage === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {currentPage === 'farmerportal' && <FarmerPortal currentUser={currentUser} />}
        {currentPage === 'marketplace' && <Marketplace />}
      </main>
    </div>
  );
}