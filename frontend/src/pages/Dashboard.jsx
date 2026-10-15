import React, { useState, useEffect } from 'react';

export default function Dashboard({ user }) {
  const [pending, setPending] = useState([]);
  const [spatialList, setSpatialList] = useState([]);
  const [activeTab, setActiveTab] = useState('approvals');

  const fetchPending = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/pending-users');
      const data = await res.json();
      setPending(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSpatial = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/spatial-submissions');
      const data = await res.json();
      setSpatialList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchSpatial();
  }, []);

  const handleStatus = async (userId, status) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/set-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status })
      });
      if (res.ok) fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('approvals')}
          className="btn-primary"
          style={{ background: activeTab === 'approvals' ? 'var(--brand-green)' : '#1f2937' }}
        >
          🛡️ Pending Registrations ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('spatial')}
          className="btn-primary"
          style={{ background: activeTab === 'spatial' ? 'var(--brand-green)' : '#1f2937' }}
        >
          📍 Crowdsourced Spatial Submissions ({spatialList.length})
        </button>
      </div>

      {activeTab === 'approvals' ? (
        <div className="card">
          <h3>Verification Queue (Pattadar Passbooks & Dealer Licenses)</h3>
          {pending.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No registrations awaiting review.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Full Name</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Document ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((u) => (
                    <tr key={u.id}>
                      <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.identifier}</td>
                      <td>{u.village}, {u.mandal}, {u.district}</td>
                      <td><code>{u.id_proof || 'N/A'}</code></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleStatus(u.id, 'approved')} className="btn-primary" style={{ padding: '0.35rem 0.65rem' }}>
                            Approve
                          </button>
                          <button onClick={() => handleStatus(u.id, 'rejected')} className="btn-danger" style={{ padding: '0.35rem 0.65rem' }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h3>Crowdsourced Spatial Records for ML/Fuzzy Matching</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            User-entered village and mandal names captured during account creation. Use this dataset to train phonetic fuzzy search.
          </p>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Raw Village</th>
                  <th>Raw Mandal</th>
                  <th>Raw District</th>
                  <th>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {spatialList.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td><strong>{s.raw_village_input}</strong></td>
                    <td>{s.raw_mandal_input}</td>
                    <td>{s.raw_district_input}</td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}