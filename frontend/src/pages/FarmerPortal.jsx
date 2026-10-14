import { useState } from "react";
import "./FarmerPortal.css";

export default function FarmerPortal() {
  const [formData, setFormData] = useState({
    farmerName: "",
    phoneNumber: "",
    villageId: "",
    crop: "Paddy",
    variety: "",
    sowingDate: "",
    harvestDate: "",
    acres: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Crop registered for Village ID: ${formData.villageId}!\nMicroclimate alerts activated.`);
  };

  return (
    <div className="portal-container">
      <div className="portal-grid">
        {/* Registration Form */}
        <section className="portal-card">
          <h3>Register Sown Crop</h3>
          <p className="subtitle">
            Link your crop cycle to your village to receive targeted weather warnings.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Farmer Name</label>
              <input
                type="text"
                required
                value={formData.farmerName}
                onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Census Village ID</label>
                <input
                  type="number"
                  required
                  value={formData.villageId}
                  onChange={(e) => setFormData({ ...formData, villageId: e.target.value })}
                  placeholder="e.g. 589123"
                />
              </div>
              <div className="form-group">
                <label>Area (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.acres}
                  onChange={(e) => setFormData({ ...formData, acres: e.target.value })}
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Crop</label>
                <select
                  value={formData.crop}
                  onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                >
                  <option value="Paddy">Paddy (Rice)</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Groundnut">Groundnut</option>
                </select>
              </div>
              <div className="form-group">
                <label>Variety</label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="e.g. BPT 5204"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sowing Date</label>
                <input
                  type="date"
                  required
                  value={formData.sowingDate}
                  onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Expected Harvest Date</label>
                <input
                  type="date"
                  required
                  value={formData.harvestDate}
                  onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-submit">
              Save Crop & Activate Climate Alerts
            </button>
          </form>
        </section>

        {/* Climate Warning Alerts */}
        <section className="portal-card">
          <h3>Active Microclimate Warnings</h3>
          <p className="subtitle">Real-time alerts triggered by downscaled village weather.</p>

          <div className="alert-card alert-warning">
            <strong>Fungal Blast Advisory (Paddy)</strong>
            <p>
              Relative humidity in high-elevation agency tracts exceeds 85% with night temps around 21°C. Monitor nursery beds closely.
            </p>
          </div>

          <div className="alert-card alert-safe">
            <strong>Favorable Sowing Window</strong>
            <p>
              No unseasonal orographic rainfall detected for the next 72 hours across Krishna and Guntur plains.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}