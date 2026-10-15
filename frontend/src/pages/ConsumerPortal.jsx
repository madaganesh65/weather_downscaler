import React, { useState, useEffect } from 'react';

const PADDY_IMG = "https://i.pinimg.com/736x/24/1f/dc/241fdc8cef3406285abb7de79012d47e.jpg";

export default function ConsumerPortal({ user }) {
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/produce')
      .then((res) => res.json())
      .then((data) => setCrops(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img 
            src={PADDY_IMG} 
            alt="Paddy" 
            style={{ width: '26px', height: '26px', objectFit: 'cover', borderRadius: '4px' }} 
          />
          <span>Fresh Farm Harvests - Direct from AP Farmers</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Connect directly with verified farmers in your district without middlemen.
        </p>
      </div>

      <div className="data-grid">
        {crops.map((c) => (
          <div key={c.id} className="item-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <img 
                  src={PADDY_IMG} 
                  alt="Harvest" 
                  style={{ width: '16px', height: '16px', objectFit: 'cover', borderRadius: '3px' }} 
                />
                <span className="role-badge farmer">Direct Harvest</span>
              </div>
              <div className="item-title" style={{ marginTop: '0.5rem' }}>{c.crop_name}</div>
              <small style={{ color: 'var(--text-muted)' }}>Variety: {c.variety}</small>
              <div className="item-price">₹{c.expected_price} / {c.unit}</div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Farmer: <strong>{c.farmer_name}</strong>
              </p>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                Location: {c.village}, {c.mandal}, {c.district}
              </p>
            </div>
            <a
              href={`tel:${c.farmer_contact}`}
              className="btn-primary"
              style={{ textAlign: 'center', marginTop: '1rem', textDecoration: 'none' }}
            >
              📞 Contact Farmer ({c.farmer_contact})
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}