import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FarmerPortal from './pages/FarmerPortal';
import SupplierPortal from './pages/SupplierPortal';
import ConsumerPortal from './pages/ConsumerPortal';

const PADDY_IMG = "https://i.pinimg.com/736x/24/1f/dc/241fdc8cef3406285abb7de79012d47e.jpg";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ap_portal_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('ap_portal_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ap_portal_user');
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img 
            src={PADDY_IMG} 
            alt="Paddy Logo" 
            style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '6px' }} 
          />
          <span>AP Microclimate & Agro-Portal</span>
        </div>
        <div className="nav-user">
          <span className={`role-badge ${currentUser.role}`}>{currentUser.role}</span>
          <span style={{ fontSize: '0.85rem' }}>{currentUser.name} ({currentUser.district})</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="main-wrapper">
        {currentUser.role === 'admin' && <Dashboard user={currentUser} />}
        {currentUser.role === 'farmer' && <FarmerPortal user={currentUser} />}
        {currentUser.role === 'supplier' && <SupplierPortal user={currentUser} />}
        {currentUser.role === 'consumer' && <ConsumerPortal user={currentUser} />}
      </div>
    </div>
  );
}