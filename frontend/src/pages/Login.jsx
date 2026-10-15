import React, { useState } from 'react';

const AP_DISTRICTS = [
  "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", 
  "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", 
  "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", 
  "Parvathipuram Manyam", "Prakasam", "SPSR Nellore", "Sri Sathya Sai", 
  "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
];

export default function Login({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login');
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

      setSuccessNotice(data.message);
      setAuthMode('login');
      setLoginIdentifier(regForm.identifier);
      setLoginPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '4rem auto', padding: '1rem' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🌾</span>
          <h1 style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>Andhra Pradesh Agro & Climate Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Microclimate Downscaling & Integrated Agro-Supply Network
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            className={`btn-primary`}
            style={{ flex: 1, background: authMode === 'login' ? 'var(--brand-green)' : '#1f2937' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
            className={`btn-primary`}
            style={{ flex: 1, background: authMode === 'register' ? 'var(--brand-green)' : '#1f2937' }}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#7f1d1d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successNotice && (
          <div style={{ background: '#064e3b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
            ✓ {successNotice}
          </div>
        )}

        {authMode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Phone Number or Official Email</label>
              <input
                type="text"
                required
                placeholder="e.g. 9848011223 or admin@ap.gov.in"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Sign In to Portal →
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                required
                placeholder="10-digit mobile"
                value={regForm.identifier}
                onChange={(e) => setRegForm({ ...regForm, identifier: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Account Role</label>
              <select
                value={regForm.role}
                onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
              >
                <option value="farmer">🌾 Farmer (Downscaling, Chat & Sell Produce)</option>
                <option value="supplier">🧪 Pesticide & Fertilizer Dealer</option>
                <option value="consumer">🛒 Direct Buyer / Consumer</option>
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>District</label>
                <select
                  value={regForm.district}
                  onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                >
                  {AP_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Mandal</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lingapalem"
                  value={regForm.mandal}
                  onChange={(e) => setRegForm({ ...regForm, mandal: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Village Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rangapuram"
                value={regForm.village}
                onChange={(e) => setRegForm({ ...regForm, village: e.target.value })}
              />
            </div>

            {regForm.role === 'farmer' && (
              <div className="form-group">
                <label>Pattadar Passbook / Rythu Bharosa ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AP-PPB-88771"
                  value={regForm.idProof}
                  onChange={(e) => setRegForm({ ...regForm, idProof: e.target.value })}
                />
              </div>
            )}

            {regForm.role === 'supplier' && (
              <div className="form-group">
                <label>Pesticides/Fertilizers Retail Trade License No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AP/AGRO/LIC/2026/09"
                  value={regForm.idProof}
                  onChange={(e) => setRegForm({ ...regForm, idProof: e.target.value })}
                />
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label>Create Password</label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  required
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.85rem' }}>
              Complete Registration →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}