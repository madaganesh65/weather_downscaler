import numpy as np
import pandas as pd
import requests

# 1. Ground truth stations across Andhra Pradesh (Airports & IMD Observatories)
stations = [
    {"name": "Visakhapatnam (Coastal/Low)", "lat": 17.7212, "lon": 83.2245, "true_elev": 5.0},
    {"name": "Vijayawada (Plains)", "lat": 16.5304, "lon": 80.7968, "true_elev": 25.0},
    {"name": "Tirupati (Piedmont)", "lat": 13.6325, "lon": 79.5433, "true_elev": 107.0},
    {"name": "Kurnool (Rayalaseema Basin)", "lat": 15.8281, "lon": 78.0373, "true_elev": 273.0},
    {"name": "Anantapur (Plateau)", "lat": 14.6819, "lon": 77.6006, "true_elev": 335.0},
    {"name": "Arogyavaram / Horsley Hills (Upland)", "lat": 13.6508, "lon": 78.3967, "true_elev": 1265.0},
    {"name": "Araku Valley (Eastern Ghats)", "lat": 18.3273, "lon": 82.8775, "true_elev": 911.0}
]

BASE_URL = "https://api.open-meteo.com/v1/forecast"
LAPSE_RATE = -0.0065  # -6.5°C per 1000m

records = []

for s in stations:
    params = {
        "latitude": s["lat"],
        "longitude": s["lon"],
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation"],
        "timezone": "Asia/Kolkata"
    }
    res = requests.get(BASE_URL, params=params).json()
    
    grid_elev = res.get("elevation", s["true_elev"])
    grid_temp = res["current"]["temperature_2m"]
    
    # Apply downscaling using the actual ground truth elevation
    delta_h = s["true_elev"] - grid_elev
    downscaled_temp = grid_temp + (delta_h * LAPSE_RATE)
    
    records.append({
        "station": s["name"],
        "true_elev_m": s["true_elev"],
        "grid_elev_m": grid_elev,
        "delta_h_m": delta_h,
        "raw_grid_temp": grid_temp,
        "downscaled_temp": round(downscaled_temp, 2)
    })

eval_df = pd.DataFrame(records)
print(eval_df.to_string(index=False))

# Terrain discrepancy summary
print("\n--- ELEVATION BIAS IN COARSE MODEL ---")
print(f"Mean Absolute Elevation Error of coarse grid: {np.mean(np.abs(eval_df['delta_h_m'])):.1f} meters")
print(f"Max Elevation Smoothing Error: {np.max(np.abs(eval_df['delta_h_m'])):.1f} meters")