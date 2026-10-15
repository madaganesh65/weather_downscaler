import React, { useState, useEffect } from 'react';
import ChatBox from '../components/ChatBox';

export default function SupplierPortal({ user }) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_name: '',
    category: 'Pesticide',
    brand: '',
    stock_quantity: 50,
    unit: 'Litre',
    price_per_unit: 450,
    description: ''
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, supplier_id: user.id })
      });
      if (res.ok) {
        alert("Stock updated successfully!");
        fetchProducts();
        setForm({
          product_name: '',
          category: 'Pesticide',
          brand: '',
          stock_quantity: 50,
          unit: 'Litre',
          price_per_unit: 450,
          description: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          className="btn-primary"
          style={{ background: activeTab === 'inventory' ? 'var(--brand-green)' : '#1f2937' }}
        >
          📦 Manage Pesticide & Fertilizer Stock
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className="btn-primary"
          style={{ background: activeTab === 'chat' ? 'var(--brand-green)' : '#1f2937' }}
        >
          💬 Farmer Advice & Orders Channel
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div>
          <div className="card">
            <h3>Add New Pesticide / Fertilizer / Seed Stock</h3>
            <form onSubmit={handleAddStock}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chlorpyrifos 20% EC"
                    value={form.product_name}
                    onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Pesticide">Pesticide / Insecticide</option>
                    <option value="Fertilizer">Chemical / Organic Fertilizer</option>
                    <option value="Seed">High-Yield Certified Seeds</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Bayer / Syngenta"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="Litre, kg, Packet"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Price per Unit (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.price_per_unit}
                    onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary">Update Stock in AP Directory →</button>
            </form>
          </div>

          <div className="card">
            <h3>Current Active Catalog</h3>
            <div className="data-grid">
              {products.map((p) => (
                <div key={p.id} className="item-card">
                  <div>
                    <span className="role-badge supplier">{p.category}</span>
                    <div className="item-title" style={{ marginTop: '0.5rem' }}>{p.product_name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>Brand: {p.brand}</small>
                    <div className="item-price">₹{p.price_per_unit} / {p.unit}</div>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>In Stock: {p.stock_quantity} {p.unit}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ChatBox currentUser={user} />
      )}
    </div>
  );
}