import React, { useState, useEffect, useRef } from 'react';

const PADDY_IMG = "https://i.pinimg.com/736x/24/1f/dc/241fdc8cef3406285abb7de79012d47e.jpg";

const AP_DEFAULT_DISTRICTS = [
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
    mobile: '',
    email: '',
    role: 'farmer',
    district: '',
    mandal: '',
    village: '',
    idProof: '',
    password: '',
    confirmPassword: ''
  });

  const [geoData, setGeoData] = useState({});
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [showDistrictList, setShowDistrictList] = useState(false);

  const [mandalSuggestions, setMandalSuggestions] = useState([]);
  const [showMandalList, setShowMandalList] = useState(false);

  const [villageSuggestions, setVillageSuggestions] = useState([]);
  const [showVillageList, setShowVillageList] = useState(false);

  const districtRef = useRef(null);
  const mandalRef = useRef(null);
  const villageRef = useRef(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/geo/hierarchy')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(() => {
        const fallback = {};
        AP_DEFAULT_DISTRICTS.forEach((d) => (fallback[d] = []));
        setGeoData(fallback);
      });
  }, []);

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setRegForm({ ...regForm, district: val, mandal: '', village: '' });

    const availableDistricts = Object.keys(geoData).length > 0 ? Object.keys(geoData) : AP_DEFAULT_DISTRICTS;
    if (val.trim()) {
      const filtered = availableDistricts.filter((d) => d.toLowerCase().includes(val.toLowerCase()));
      setDistrictSuggestions(filtered);
      setShowDistrictList(true);
    } else {
      setDistrictSuggestions(availableDistricts);
      setShowDistrictList(true);
    }
  };

  const handleMandalChange = (e) => {
    const val = e.target.value;
    setRegForm({ ...regForm, mandal: val, village: '' });

    const mandalsInDistrict = geoData[regForm.district] || [];
    if (val.trim()) {
      const filtered = mandalsInDistrict.filter((m) => m.toLowerCase().includes(val.toLowerCase()));
      setMandalSuggestions(filtered);
    } else {
      setMandalSuggestions(mandalsInDistrict);
    }
    setShowMandalList(true);
  };

  const handleVillageChange = (e) => {
    const val = e.target.value;
    setRegForm({ ...regForm, village: val });

    if (val.trim().length >= 2) {
      fetch(`http://127.0.0.1:8000/api/villages/search?q=${encodeURIComponent(val)}&district=${encodeURIComponent(regForm.district || '')}`)
        .then((res) => res.json())
        .then((data) => {
          setVillageSuggestions(data.villages || []);
          setShowVillageList(true);
        })
        .catch(() => setVillageSuggestions([]));
    } else {
      setVillageSuggestions([]);
      setShowVillageList(false);
    }
  };

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
      setLoginIdentifier(regForm.mobile);
      setLoginPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '3rem auto', padding: '1rem' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img 
            src={PADDY_IMG} 
            alt="AP Agriculture Emblem" 
            style={{
              width: '72px',
              height: '72px',
              objectFit: 'cover',
              borderRadius: '16px',
              display: 'block',
              margin: '0 auto 0.75rem auto',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          />
          <h1 style={{ fontSize: '1.35rem', marginTop: '0.5rem' }}>AP Agro-Climate Gateway</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Microclimate Downscaling & Integrated Rural Supply Directory
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            className="btn-primary"
            style={{ flex: 1, background: authMode === 'login' ? 'var(--brand-green)' : '#1f2937' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
            className="btn-primary"
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
              <label>Registered Mobile Number or Email</label>
              <input
                type="text"
                required
                placeholder="e.g. 9848022338 or farmer@gmail.com"
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
              <label>Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. K. Rambabu"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Mobile Number (Primary)</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  pattern="[0-9]{10}"
                  value={regForm.mobile}
                  onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Account Role</label>
              <select
                value={regForm.role}
                onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
              >
                <option value="farmer">Farmer (Downscaling, Chat & Sell Produce)</option>
                <option value="supplier">🧪 Agro-Pesticide & Fertilizer Dealer</option>
                <option value="consumer">🛒 Direct Buyer / Consumer</option>
              </select>
            </div>

            <div className="form-grid" style={{ position: 'relative' }}>
              <div className="form-group" style={{ position: 'relative' }} ref={districtRef}>
                <label>District (Type to filter)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eluru, Guntur..."
                  value={regForm.district}
                  onChange={handleDistrictChange}
                  onFocus={() => {
                    const list = Object.keys(geoData).length > 0 ? Object.keys(geoData) : AP_DEFAULT_DISTRICTS;
                    setDistrictSuggestions(list);
                    setShowDistrictList(true);
                  }}
                />
                {showDistrictList && districtSuggestions.length > 0 && (
                  <div style={dropdownStyle}>
                    {districtSuggestions.map((d) => (
                      <div
                        key={d}
                        style={dropdownItemStyle}
                        onMouseDown={() => {
                          setRegForm({ ...regForm, district: d, mandal: '', village: '' });
                          setShowDistrictList(false);
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }} ref={mandalRef}>
                <label>Mandal (Type to filter)</label>
                <input
                  type="text"
                  required
                  disabled={!regForm.district}
                  placeholder={regForm.district ? "Select or type mandal" : "Choose district first"}
                  value={regForm.mandal}
                  onChange={handleMandalChange}
                  onFocus={() => {
                    if (regForm.district && geoData[regForm.district]) {
                      setMandalSuggestions(geoData[regForm.district]);
                      setShowMandalList(true);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowMandalList(false), 200)}
                />
                {showMandalList && mandalSuggestions.length > 0 && (
                  <div style={dropdownStyle}>
                    {mandalSuggestions.map((m) => (
                      <div
                        key={m}
                        style={dropdownItemStyle}
                        onMouseDown={() => {
                          setRegForm({ ...regForm, mandal: m, village: '' });
                          setShowMandalList(false);
                        }}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }} ref={villageRef}>
              <label>Village Name (Live search suggestions)</label>
              <input
                type="text"
                required
                placeholder="Type village name (even with spelling errors)..."
                value={regForm.village}
                onChange={handleVillageChange}
                onBlur={() => setTimeout(() => setShowVillageList(false), 250)}
              />
              {showVillageList && villageSuggestions.length > 0 && (
                <div style={dropdownStyle}>
                  {villageSuggestions.map((v) => (
                    <div
                      key={v.village_id}
                      style={{ ...dropdownItemStyle, display: 'flex', justifyContent: 'space-between' }}
                      onMouseDown={() => {
                        setRegForm({
                          ...regForm,
                          village: v.name,
                          mandal: v.subdistrict_name || regForm.mandal,
                          district: v.district_name || regForm.district
                        });
                        setShowVillageList(false);
                      }}
                    >
                      <span><strong>{v.name}</strong> ({v.subdistrict_name || 'Mandal'})</span>
                      {v.match_score && (
                        <span style={{ fontSize: '0.7rem', color: '#34d399' }}>{v.match_score}%</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {regForm.role === 'farmer' && (
              <div className="form-group">
                <label>Pattadar Passbook / Rythu 1B Passbook ID</label>
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
                <label>Pesticides/Fertilizers Trade License Number</label>
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

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Submit Registration →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  maxHeight: '180px',
  overflowY: 'auto',
  background: '#0d131f',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  zIndex: 1000,
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
};

const dropdownItemStyle = {
  padding: '0.6rem 0.85rem',
  fontSize: '0.8rem',
  cursor: 'pointer',
  borderBottom: '1px solid #1f2937',
  color: '#e2e8f0',
  transition: 'background 0.15s'
};