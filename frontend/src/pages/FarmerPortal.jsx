import React, { useState, useEffect } from 'react';
import ChatBox from '../components/ChatBox';

export default function FarmerPortal({ user }) {
  const [activeTab, setActiveTab] = useState('weather');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [pesticides, setPesticides] = useState([]);

  // Crop produce state
  const [crops, setCrops] = useState([]);
  const [cropForm, setCropForm] = useState({
    crop_name: 'Paddy (BPT 5204)',
    variety: 'Super Sona Masoori',
    quantity_available: 50,
    unit: 'Bags (75kg)',
    expected_price: 1850
  });

  // Search villages with phonetic/fuzzy matching
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const delayDebounce = setTimeout(() => {
        fetch(`http://127.0.0.1:8000/api/villages/search?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => setSearchResults(data.villages || []))
          .catch(console.error);
      }, 250);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Load weather when a village is selected
  const handleSelectVillage = async (villageId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/weather/village/${villageId}`);
      const data = await res.json();
      setWeatherData(data);
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Load available pesticides & fertilizers
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/products')
      .then((res) => res.json())
      .then((data) => setPesticides(data))
      .catch(console.error);
  }, []);

  // Post harvest produce
  const handleAddProduce = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/produce/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cropForm, farmer_id: user.id })
      });
      if (res.ok) {
        alert("Produce successfully listed for buyers!");
        setCropForm({
          crop_name: '',
          variety: '',
          quantity_available: 10,
          unit: 'Quintal',
          expected_price: 2000
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('weather')}
          className="btn-primary"
          style={{ background: activeTab === 'weather' ? 'var(--brand-green)' : '#1f2937' }}
        >
          🌤️ Microclimate Weather Downscaler
        </button>
        <button
          onClick={() => setActiveTab('pesticides')}
          className="btn-primary"
          style={{ background: activeTab === 'pesticides' ? 'var(--brand-green)' : '#1f2937' }}
        >
          🧪 Certified Pesticides & Fertilizers
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className="btn-primary"
          style={{ background: activeTab === 'sell' ? 'var(--brand-green)' : '#1f2937' }}
        >
          📦 Sell Farm Harvest to Buyers
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className="btn-primary"
          style={{ background: activeTab === 'chat' ? 'var(--brand-green)' : '#1f2937' }}
        >
          💬 Consult Agro-Dealer
        </button>
      </div>

      {/* TAB 1: Downscaling Weather Engine */}
      {activeTab === 'weather' && (
        <div>
          <div className="card">
            <h3>Find Your Revenue Village (Phonetic & Typo-Tolerant Search)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Type your village name even with phonetic spelling differences (e.g., <em>Lingapalam</em>, <em>Kaikaloor</em>, <em>Kovur</em>).
            </p>
            <input
              type="text"
              placeholder="Search village name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.75rem' }}
            />

            {searchResults.length > 0 && (
              <div style={{ background: '#0d131f', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {searchResults.map((v) => (
                  <div
                    key={v.village_id}
                    onClick={() => handleSelectVillage(v.village_id)}
                    style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1f2937', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong>{v.name}</strong> ({v.subdistrict_name}, {v.district_name})
                    </div>
                    {v.match_score && (
                      <span style={{ fontSize: '0.75rem', background: '#065f46', color: '#6ee7b7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {v.match_score}% match
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {weatherData && (
            <div className="card">
              <h3>Downscaled Microclimate Intelligence: {weatherData.village_info.village_name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Mandal: {weatherData.village_info.subdistrict_name} | District: {weatherData.village_info.district_name}
              </p>

              <div className="data-grid" style={{ marginTop: '1.25rem' }}>
                <div className="item-card">
                  <div className="item-title">Localized Temperature</div>
                  <div className="item-price" style={{ color: '#f59e0b', fontSize: '2rem' }}>
                    {weatherData.downscaled_weather.temperature_c}°C
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>
                    Lapse Rate Adjustment: {weatherData.downscaled_weather.adjustment_c}°C
                  </small>
                </div>

                <div className="item-card">
                  <div className="item-title">Topographic DEM Elevation</div>
                  <div className="item-price" style={{ color: '#38bdf8', fontSize: '2rem' }}>
                    {weatherData.topography.dem_elevation_m} m
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>
                    Grid Delta: {weatherData.topography.elevation_delta_m} m
                  </small>
                </div>

                <div className="item-card">
                  <div className="item-title">Relative Humidity</div>
                  <div className="item-price" style={{ color: '#10b981', fontSize: '2rem' }}>
                    {weatherData.downscaled_weather.relative_humidity_pct}%
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>Synoptic station estimate</small>
                </div>

                <div className="item-card">
                  <div className="item-title">Wind Speed (10m)</div>
                  <div className="item-price" style={{ color: '#a78bfa', fontSize: '2rem' }}>
                    {weatherData.downscaled_weather.wind_speed_kmh} km/h
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>Field operational conditions</small>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Certified Pesticides & Fertilizers */}
      {activeTab === 'pesticides' && (
        <div className="card">
          <h3>Authorized Dealer Pesticides & Fertilizers</h3>
          <div className="data-grid">
            {pesticides.map((p) => (
              <div key={p.id} className="item-card">
                <div>
                  <span className="role-badge supplier">{p.category}</span>
                  <div className="item-title" style={{ marginTop: '0.5rem' }}>{p.product_name}</div>
                  <small style={{ color: 'var(--text-muted)' }}>Dealer: {p.supplier_name} ({p.mandal})</small>
                  <div className="item-price">₹{p.price_per_unit} / {p.unit}</div>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Available: {p.stock_quantity} {p.unit}s</p>
                </div>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="btn-primary"
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  💬 Inquire / Order via Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Sell Harvest to Consumers */}
      {activeTab === 'sell' && (
        <div className="card">
          <h3>List Harvested Crops for Consumers</h3>
          <form onSubmit={handleAddProduce}>
            <div className="form-grid">
              <div className="form-group">
                <label>Crop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chilli / Paddy / Cotton"
                  value={cropForm.crop_name}
                  onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Variety</label>
                <input
                  type="text"
                  placeholder="e.g. Teja / Guntur Sannam"
                  value={cropForm.variety}
                  onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Available Quantity</label>
                <input
                  type="number"
                  required
                  value={cropForm.quantity_available}
                  onChange={(e) => setCropForm({ ...cropForm, quantity_available: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  placeholder="Quintal, Bags, kg"
                  value={cropForm.unit}
                  onChange={(e) => setCropForm({ ...cropForm, unit: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Expected Price per Unit (₹)</label>
                <input
                  type="number"
                  required
                  value={cropForm.expected_price}
                  onChange={(e) => setCropForm({ ...cropForm, expected_price: Number(e.target.value) })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">Post Produce to Marketplace →</button>
          </form>
        </div>
      )}

      {/* TAB 4: Dealer Chat */}
      {activeTab === 'chat' && <ChatBox currentUser={user} />}
    </div>
  );
}