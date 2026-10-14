import { useState, useEffect } from "react";
import "./Dashboard.css";

const API_BASE = "http://127.0.0.1:8000";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {  
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/villages/search?q=${encodeURIComponent(searchQuery)}&limit=8`
        );
        const data = await res.json();
        setSuggestions(data.villages || []);
      } catch (err) {
        console.error("Village search error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectVillage = async (village) => {
    setSuggestions([]);
    setSearchQuery(village.name);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/weather/village/${village.village_id}`);
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      console.error("Downscaled weather fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <section className="search-banner">
          <h2>Microclimate Downscaling Engine</h2>
          <p>
            Real-time hyper-local weather downscaled to 30m resolution using ALOS AW3D30 DEM
            and environmental lapse-rate physics.
          </p>

          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Andhra Pradesh village name (e.g. Kokkirapadu, Araku, Tirupati)..."
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((v) => (
                  <div
                    key={v.village_id}
                    className="suggestion-row"
                    onClick={() => handleSelectVillage(v)}
                  >
                    <div>
                      <strong>{v.name}</strong>
                      <span className="sub-text">
                        {v.subdistrict_name} &bull; {v.district_name}
                      </span>
                    </div>
                    <span className="badge-elev">{v.elevation_m} m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {loading && <p className="status-indicator">Fetching real-time topography & weather model...</p>}

        {weatherData && (
          <div className="results-container">
            <div className="village-header-card">
              <div>
                <h3>{weatherData.village_info.village_name}</h3>
                <span className="meta-info">
                  {weatherData.village_info.subdistrict_name}, {weatherData.village_info.district_name} &bull; Coordinates: {weatherData.village_info.coordinates.latitude}&deg;N, {weatherData.village_info.coordinates.longitude}&deg;E
                </span>
              </div>
              <div className="elevation-summary">
                <span>Terrain Elevation</span>
                <h4>{weatherData.topography.dem_elevation_m} m</h4>
              </div>
            </div>

            <div className="metrics-layout">
              <div className="metric-panel">
                <span className="panel-title">Air Temperature (2m)</span>
                <div className="metric-large">
                  {weatherData.downscaled_weather.temperature_c}&deg;C
                </div>
                <div className="metric-comparison">
                  <span>Macro Grid: {weatherData.coarse_weather.temperature_c}&deg;C</span>
                  <span className={`diff-pill ${weatherData.downscaled_weather.temperature_c <= weatherData.coarse_weather.temperature_c ? "cooler" : "warmer"}`}>
                    {(weatherData.downscaled_weather.temperature_c - weatherData.coarse_weather.temperature_c).toFixed(2)}&deg;C lapse delta
                  </span>
                </div>
              </div>

              <div className="metric-panel">
                <span className="panel-title">Topographic Delta (&Delta;h)</span>
                <div className="metric-large">
                  {weatherData.topography.elevation_delta_m > 0 ? "+" : ""}
                  {weatherData.topography.elevation_delta_m} m
                </div>
                <div className="metric-comparison">
                  <span>Coarse Model Cell: {weatherData.topography.weather_grid_elevation_m} m</span>
                  <span className="sub-text">Actual DEM vs Grid Height</span>
                </div>
              </div>

              <div className="metric-panel">
                <span className="panel-title">Rainfall Rate</span>
                <div className="metric-large">
                  {weatherData.downscaled_weather.rainfall_rate_mm_hr} mm/h
                </div>
                <div className="metric-comparison">
                  <span>Macro Grid: {weatherData.coarse_weather.rainfall_rate_mm_hr} mm/h</span>
                  <span className="sub-text">Orographic scaling applied</span>
                </div>
              </div>

              <div className="metric-panel">
                <span className="panel-title">Atmospheric Context</span>
                <div className="metric-large">
                  {weatherData.downscaled_weather.relative_humidity_pct}%
                </div>
                <div className="metric-comparison">
                  <span>Relative Humidity</span>
                  <span>Wind: {weatherData.downscaled_weather.wind_speed_kmh} km/h</span>
                </div>
              </div>
            </div>

            <div className="physics-explainer">
              <strong>Physics Formulation Applied:</strong> Standard environmental lapse rate (T_local = T_grid + &Delta;h &times; -0.0065&deg;C/m) adjusted for ALOS AW3D30 30-meter elevation difference, with orographic rainfall rate scaling.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}