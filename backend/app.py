import os
import json
import pandas as pd
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from auth_routes import router as auth_router

# 1. Initialize FastAPI Application
app = FastAPI(
    title="Andhra Pradesh Microclimate Weather Downscaler API",
    description="High-resolution localized microclimate intelligence service."
)

# 2. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Authentication & Database Router
app.include_router(auth_router)

# 4. Load Geographical & Elevation Datasets
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MANDAL_MAP_PATH = os.path.join(BASE_DIR, "mandal_map.json")
VILLAGES_CSV_PATH = os.path.join(BASE_DIR, "ap_villages_final.csv")

mandal_map = {}
if os.path.exists(MANDAL_MAP_PATH):
    try:
        with open(MANDAL_MAP_PATH, "r", encoding="utf-8") as f:
            mandal_map = json.load(f)
        print(f"Loaded {len(mandal_map)} verified mandals from mandal_map.json.")
    except Exception as e:
        print(f"[Warning]: Failed to parse mandal_map.json: {e}")
else:
    print(f"[Warning]: {MANDAL_MAP_PATH} not found.")

villages_df = pd.DataFrame()
COL_NAME = "village_name"
COL_ELEV = "elevation"
COL_SUBDIST = "subdistrict_name"
COL_DIST = "district_name"
COL_LAT = "latitude"
COL_LON = "longitude"
COL_ID = "id"

if os.path.exists(VILLAGES_CSV_PATH):
    villages_df = pd.read_csv(VILLAGES_CSV_PATH)
    cols = list(villages_df.columns)
    print(f"Detected CSV columns: {cols}")

    # Dynamic Column Resolution to prevent KeyError
    def find_col(candidates, default):
        for c in candidates:
            for col in cols:
                if col.lower().strip() == c.lower().strip():
                    return col
        return default

    COL_NAME = find_col(["village_name", "villagename", "name", "village", "village_name_en"], cols[0] if cols else "village_name")
    COL_ELEV = find_col(["elevation", "elevation_m", "dem_elevation", "dem", "elev"], "elevation")
    COL_SUBDIST = find_col(["subdistrict_name", "subdistrict", "mandal_name", "mandal", "tehsil"], "subdistrict_name")
    COL_DIST = find_col(["district_name", "district", "dist_name"], "district_name")
    COL_LAT = find_col(["latitude", "lat", "y"], "latitude")
    COL_LON = find_col(["longitude", "lon", "lng", "x"], "longitude")
    COL_ID = find_col(["village_code", "village_id", "code", "id", "objectid"], "id")

    # Clean and index search column
    if COL_NAME in villages_df.columns:
        villages_df["village_name_clean"] = villages_df[COL_NAME].astype(str).str.strip().str.lower()
    else:
        villages_df["village_name_clean"] = villages_df.index.astype(str)

    print(f"Loaded {len(villages_df)} Andhra Pradesh villages from ap_villages_final.csv using column: '{COL_NAME}'.")
else:
    print(f"[Warning]: {VILLAGES_CSV_PATH} not found.")

# 5. Core Weather & Downscaling Endpoints

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "AP Microclimate Downscaler API",
        "villages_loaded": len(villages_df),
        "mandals_mapped": len(mandal_map)
    }

@app.get("/api/villages/search")
def search_villages(q: str = Query(..., min_length=2, description="Search query")):
    if villages_df.empty:
        return {"villages": []}

    query = q.strip().lower()
    matches = villages_df[villages_df["village_name_clean"].str.contains(query, na=False)].head(15)

    results = []
    for idx, row in matches.iterrows():
        v_id = row.get(COL_ID, idx)
        try:
            v_id = int(v_id)
        except (ValueError, TypeError):
            v_id = int(idx)

        results.append({
            "village_id": v_id,
            "name": str(row.get(COL_NAME, f"Village {v_id}")),
            "subdistrict_name": str(row.get(COL_SUBDIST, "")),
            "district_name": str(row.get(COL_DIST, "")),
            "latitude": float(row.get(COL_LAT, 0.0) if pd.notnull(row.get(COL_LAT)) else 0.0),
            "longitude": float(row.get(COL_LON, 0.0) if pd.notnull(row.get(COL_LON)) else 0.0),
            "elevation_m": float(row.get(COL_ELEV, 45.0) if pd.notnull(row.get(COL_ELEV)) else 45.0)
        })

    return {"villages": results}

@app.get("/api/weather/village/{village_id}")
def get_downscaled_weather(village_id: int):
    if villages_df.empty:
        raise HTTPException(status_code=500, detail="Village dataset unavailable.")

    # Match by identified ID column or index
    if COL_ID in villages_df.columns:
        match = villages_df[villages_df[COL_ID] == village_id]
    else:
        match = pd.DataFrame()

    if match.empty:
        if village_id in villages_df.index:
            row = villages_df.loc[village_id]
        else:
            raise HTTPException(status_code=404, detail="Village record not found.")
    else:
        row = match.iloc[0]

    lat = float(row.get(COL_LAT, 16.5) if pd.notnull(row.get(COL_LAT)) else 16.5)
    lon = float(row.get(COL_LON, 80.5) if pd.notnull(row.get(COL_LON)) else 80.5)
    local_elevation = float(row.get(COL_ELEV, 45.0) if pd.notnull(row.get(COL_ELEV)) else 45.0)
    v_name = str(row.get(COL_NAME, "Selected Village"))
    subdistrict = str(row.get(COL_SUBDIST, ""))
    district = str(row.get(COL_DIST, ""))

    # Fetch coarse synoptic weather from Open-Meteo
    grid_temp = 32.0
    grid_elevation = 20.0
    humidity = 65
    wind_speed = 12.0

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&elevation=nan"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            current = data.get("current", {})
            grid_temp = current.get("temperature_2m", grid_temp)
            humidity = current.get("relative_humidity_2m", humidity)
            wind_speed = current.get("wind_speed_10m", wind_speed)
            grid_elevation = data.get("elevation", grid_elevation)
    except Exception as e:
        print(f"[Weather API Warning]: {e}")

    # Microclimate Environmental Lapse Rate calculation: ~6.5°C per 1000m
    lapse_rate = 0.0065
    delta_h = local_elevation - grid_elevation
    downscaled_temp = round(grid_temp - (delta_h * lapse_rate), 2)

    return {
        "village_info": {
            "village_id": village_id,
            "village_name": v_name,
            "subdistrict_name": subdistrict,
            "district_name": district,
            "latitude": lat,
            "longitude": lon
        },
        "topography": {
            "dem_elevation_m": round(local_elevation, 1),
            "coarse_grid_elevation_m": round(grid_elevation, 1),
            "elevation_delta_m": round(delta_h, 1)
        },
        "coarse_weather": {
            "temperature_c": round(grid_temp, 2),
            "relative_humidity_pct": humidity,
            "wind_speed_kmh": wind_speed
        },
        "downscaled_weather": {
            "temperature_c": downscaled_temp,
            "relative_humidity_pct": humidity,
            "wind_speed_kmh": wind_speed,
            "adjustment_c": round(-(delta_h * lapse_rate), 2)
        }
    }