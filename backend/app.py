import os
import json
import requests
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import process, fuzz
from psycopg2.extras import RealDictCursor

from auth_routes import router as auth_router
from database import get_db_connection

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

# 3. Mount Authentication Router
app.include_router(auth_router)

# 4. Load Datasets
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
        print(f"[Warning]: Failed to load mandal_map.json: {e}")

villages_df = pd.DataFrame()
village_lookup_names = []  # In-memory index for fast Levenshtein matching

if os.path.exists(VILLAGES_CSV_PATH):
    villages_df = pd.read_csv(VILLAGES_CSV_PATH)
    cols = list(villages_df.columns)

    # Dynamic Column Resolution
    def find_col(candidates, default):
        for c in candidates:
            for col in cols:
                if col.lower().strip() == c.lower().strip():
                    return col
        return default

    COL_NAME = find_col(["village_name", "villagename", "name", "village"], cols[0] if cols else "village_name")
    COL_ELEV = find_col(["elevation", "elevation_m", "dem_elevation", "dem", "elev"], "elevation")
    COL_SUBDIST = find_col(["subdistrict_name", "subdistrict", "mandal_name", "mandal"], "subdistrict_name")
    COL_DIST = find_col(["district_name", "district"], "district_name")
    COL_LAT = find_col(["latitude", "lat"], "latitude")
    COL_LON = find_col(["longitude", "lon", "lng"], "longitude")
    COL_ID = find_col(["village_code", "village_id", "code", "id"], "id")

    # Clean text columns
    villages_df["clean_village"] = villages_df[COL_NAME].astype(str).str.strip().str.lower()
    villages_df["clean_mandal"] = villages_df[COL_SUBDIST].astype(str).str.strip().str.lower() if COL_SUBDIST in villages_df.columns else ""
    villages_df["clean_district"] = villages_df[COL_DIST].astype(str).str.strip().str.lower() if COL_DIST in villages_df.columns else ""

    # Pre-index names for RapidFuzz
    village_lookup_names = villages_df["clean_village"].tolist()
    print(f"Indexed {len(villages_df)} Andhra Pradesh villages for RapidFuzz phonetic search.")
else:
    print(f"[Warning]: {VILLAGES_CSV_PATH} not found.")

# ----------------- Phonetic & Fuzzy Search Route -----------------

@app.get("/api/villages/search")
def search_villages(
    q: str = Query(..., min_length=2, description="Search query"),
    district: str = Query(None, description="Optional District Filter")
):
    """
    3-Stage Search:
    1. Check verified crowdsourced table in PostgreSQL.
    2. Exact substring search in ap_villages_final.csv.
    3. RapidFuzz WRatio (Levenshtein + Token Sort) with match confidence scoring.
    """
    if villages_df.empty:
        return {"villages": []}

    query_raw = q.strip()
    query_clean = query_raw.lower()

    # --- STAGE 1: Check Crowdsourced Learned Database First ---
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT raw_village_input, raw_mandal_input, raw_district_input, 
                           resolved_lat, resolved_lon, resolved_elevation 
                    FROM spatial_corrections 
                    WHERE (LOWER(raw_village_input) = %s OR LOWER(raw_village_input) LIKE %s)
                      AND resolved_lat IS NOT NULL
                    LIMIT 5;
                """, (query_clean, f"%{query_clean}%"))
                crowd_hits = cur.fetchall()

                if crowd_hits:
                    conn.close()
                    results = []
                    for row in crowd_hits:
                        results.append({
                            "village_id": 900000,
                            "name": row["raw_village_input"],
                            "subdistrict_name": row["raw_mandal_input"],
                            "district_name": row["raw_district_input"],
                            "latitude": float(row["resolved_lat"]),
                            "longitude": float(row["resolved_lon"]),
                            "elevation_m": float(row["resolved_elevation"]),
                            "match_score": 100,
                            "source": "crowdsourced_verified"
                        })
                    return {"villages": results}
        except Exception as e:
            print(f"[DB Spatial Query Warning]: {e}")
        finally:
            if not conn.closed:
                conn.close()

    # --- STAGE 2: Exact Substring Matching ---
    subset_df = villages_df
    if district and COL_DIST in villages_df.columns:
        subset_df = subset_df[subset_df["clean_district"] == district.strip().lower()]

    direct_matches = subset_df[subset_df["clean_village"].str.contains(query_clean, na=False)].head(10)

    if not direct_matches.empty:
        results = []
        for idx, row in direct_matches.iterrows():
            results.append({
                "village_id": int(row.get(COL_ID, idx)),
                "name": str(row.get(COL_NAME, "")),
                "subdistrict_name": str(row.get(COL_SUBDIST, "")),
                "district_name": str(row.get(COL_DIST, "")),
                "latitude": float(row.get(COL_LAT, 0.0) if pd.notnull(row.get(COL_LAT)) else 0.0),
                "longitude": float(row.get(COL_LON, 0.0) if pd.notnull(row.get(COL_LON)) else 0.0),
                "elevation_m": float(row.get(COL_ELEV, 45.0) if pd.notnull(row.get(COL_ELEV)) else 45.0),
                "match_score": 100,
                "match_type": "exact_substring"
            })
        return {"villages": results}

    # --- STAGE 3: Fuzzy Levenshtein & Phonetic Scoring ---
    # rapidfuzz.process.extract uses weighted ratio (handles typos, character swaps, dropped vowels)
    fuzzy_hits = process.extract(
        query_clean,
        village_lookup_names,
        scorer=fuzz.WRatio,
        limit=8,
        score_cutoff=65.0  # Accept matches with >= 65% similarity
    )

    results = []
    for match_tuple in fuzzy_hits:
        matched_str, score, matched_idx = match_tuple
        row = villages_df.iloc[matched_idx]

        results.append({
            "village_id": int(row.get(COL_ID, matched_idx)),
            "name": str(row.get(COL_NAME, "")),
            "subdistrict_name": str(row.get(COL_SUBDIST, "")),
            "district_name": str(row.get(COL_DIST, "")),
            "latitude": float(row.get(COL_LAT, 0.0) if pd.notnull(row.get(COL_LAT)) else 0.0),
            "longitude": float(row.get(COL_LON, 0.0) if pd.notnull(row.get(COL_LON)) else 0.0),
            "elevation_m": float(row.get(COL_ELEV, 45.0) if pd.notnull(row.get(COL_ELEV)) else 45.0),
            "match_score": round(score, 1),
            "match_type": "fuzzy_phonetic"
        })

    return {"villages": results}


# ----------------- Weather Downscaling Engine -----------------

@app.get("/api/weather/village/{village_id}")
def get_downscaled_weather(village_id: int):
    if villages_df.empty:
        raise HTTPException(status_code=500, detail="Village dataset unavailable.")

    # Match by ID column or row index
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

    # Fetch synoptic grid forecast from Open-Meteo
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

    # Environmental Lapse Rate downscaling: -6.5°C per 1000m elevation gain
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