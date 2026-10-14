import React, { useState } from 'react';
import './Login.css';

const AP_DISTRICTS = [
  "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", 
  "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", 
  "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", 
  "Parvathipuram Manyam", "Prakasam", "SPSR Nellore", "Sri Sathya Sai", 
  "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
];

export default function Login({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const [regForm, setRegForm] = useState({
    name: '',
    identifier: '',
    role: 'farmer',
    district: 'Eluru',
    mandal: '',
    village: '',
    idProof: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      onLoginSuccess(data);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    if (regForm.password !== regForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      setSuccessNotice('Registration submitted! Your record is awaiting Admin approval.');
      setAuthMode('login');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-glow-1" />
      <div className="login-glow-2" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-box">🌱</div>
          <h1 className="login-title">Andhra Pradesh Microclimate Portal</h1>
          <p className="login-subtitle">High-Resolution Weather Downscaling & Agro-Portal</p>
        </div>

        <div className="tab-container">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessNotice(''); }}
            className={`tab-btn ${authMode === 'login' ? 'active' : ''}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessNotice(''); }}
            className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && <div className="alert-error">⚠️ {errorMsg}</div>}
        {successNotice && <div className="alert-success">✓ {successNotice}</div>}

        {authMode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Registered Mobile / Email</label>
              <input
                type="text"
                required
                placeholder="e.g. 9848022338 or admin@ap.gov.in"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="form-input"
              />
            </div>
            <button type="submit" className="btn-primary">Sign In to Portal →</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="alert-info">ℹ️ Approvals gated by District Administrator.</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={regForm.identifier}
                  onChange={(e) => setRegForm({ ...regForm, identifier: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={regForm.role}
                  onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                  className="form-select"
                >
                  <option value="farmer">Farmer</option>
                  <option value="officer">Agricultural Officer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <select
                  value={regForm.district}
                  onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                  className="form-select"
                >
                  {AP_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Mandal Name</label>
                <input
                  type="text"
                  required
                  value={regForm.mandal}
                  onChange={(e) => setRegForm({ ...regForm, mandal: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Village Name</label>
                <input
                  type="text"
                  value={regForm.village}
                  onChange={(e) => setRegForm({ ...regForm, village: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pattadar Passbook / Govt ID</label>
              <input
                type="text"
                required
                value={regForm.idProof}
                onChange={(e) => setRegForm({ ...regForm, idProof: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">Submit Application →</button>
          </form>
        )}
      </div>
    </div>
  );
}