import "./Marketplace.css";

export default function Marketplace() {
  const products = [
    {
      id: 1,
      title: "BPT 5204 (Sona Masuri)",
      origin: "Kesarapalle, Krishna District",
      desc: "Aged premium raw rice, harvested after low-moisture weather window.",
      price: "₹54 / kg",
    },
    {
      id: 2,
      title: "Guntur Sannam Chilli (Dry)",
      origin: "Guntur Rural, AP",
      desc: "Direct harvest, dried under controlled sunlight conditions.",
      price: "₹210 / kg",
    },
    {
      id: 3,
      title: "Araku Organic Arabica Coffee",
      origin: "Araku Agency (910m Elevation)",
      desc: "Shade-grown at high altitude, wet-processed parchment beans.",
      price: "₹450 / 500g",
    },
  ];

  return (
    <div className="marketplace-container">
      <div className="marketplace-content">
        <header className="catalog-header">
          <h3>Direct Produce Marketplace</h3>
          <p>Verified village origins with downscaled microclimate harvest tracking.</p>
        </header>

        <div className="products-grid">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <span className="badge">Direct from Farmer</span>
              <h4>{p.title}</h4>
              <p className="origin">Origin: {p.origin}</p>
              <p className="desc">{p.desc}</p>
              <div className="price-row">
                <span className="price">{p.price}</span>
                <button
                  className="btn-order"
                  onClick={() => alert(`Order placed for ${p.title}!`)}
                >
                  Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}