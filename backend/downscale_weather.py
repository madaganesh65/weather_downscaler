import pandas as pd
import requests

villages_df = pd.read_csv("ap_villages_final.csv")

# Sample a batch of villages to demonstrate (or run across a whole mandal/district)
sample_df = villages_df.sample(n=10, random_state=42).copy()

BASE_URL = "https://api.open-meteo.com/v1/forecast"
LAPSE_RATE = -0.0065          # -6.5°C per 1000m
OROGRAPHIC_COEFF = 0.0008     # ~8% rain increase per 100m elevation gain on moist air

results = []

for _, row in sample_df.iterrows():
    lat, lon = row["latitude"], row["longitude"]
    local_elev = row["elevation_m"]
    
    # Query current weather: temperature, humidity, precipitation, wind
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation"],
        "timezone": "Asia/Kolkata"
    }
    
    res = requests.get(BASE_URL, params=params).json()
    
    grid_elev = res.get("elevation", local_elev)
    grid_temp = res["current"]["temperature_2m"]
    grid_humidity = res["current"]["relative_humidity_2m"]
    grid_precip = res["current"]["precipitation"]  # in mm
    
    # --- 1. TEMPERATURE DOWNSCALING ---
    delta_h = local_elev - grid_elev
    downscaled_temp = grid_temp + (delta_h * LAPSE_RATE)
    
    # --- 2. PRECIPITATION DOWNSCALING ---
    if grid_precip > 0:
        # Orographic elevation enhancement factor (capped between 0.5x and 2.0x to avoid runaway values)
        orographic_factor = max(0.5, min(2.0, 1.0 + (delta_h * OROGRAPHIC_COEFF)))
        downscaled_precip = grid_precip * orographic_factor
    else:
        # Zero rain from macro model remains zero rain
        downscaled_precip = 0.0
        
    results.append({
        "village": row["town_village_name"],
        "elevation_m": round(local_elev, 1),
        "elevation_delta_m": round(delta_h, 1),
        "temp_c": round(downscaled_temp, 2),
        "humidity_pct": grid_humidity,
        "rainfall_mm": round(downscaled_precip, 2)
    })

output_df = pd.DataFrame(results)
print(output_df)