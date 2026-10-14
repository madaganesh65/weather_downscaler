import pandas as pd
import numpy as np
from scipy.spatial import cKDTree

# 1. Official Ground Truth Benchmarks (Survey of India / Airport METARs)
ground_truth = [
    {"name": "Visakhapatnam Port/Airport", "lat": 17.7212, "lon": 83.2245, "survey_elev": 5.0},
    {"name": "Vijayawada Plains", "lat": 16.5304, "lon": 80.7968, "survey_elev": 25.0},
    {"name": "Tirupati Foot-hills", "lat": 13.6325, "lon": 79.5433, "survey_elev": 107.0},
    {"name": "Kurnool Tungabhadra Basin", "lat": 15.8281, "lon": 78.0373, "survey_elev": 273.0},
    {"name": "Anantapur Plateau", "lat": 14.6819, "lon": 77.6006, "survey_elev": 335.0},
    {"name": "Horsley Hills Peak", "lat": 13.6508, "lon": 78.3967, "survey_elev": 1265.0},
    {"name": "Araku Valley", "lat": 18.3273, "lon": 82.8775, "survey_elev": 911.0}
]

# 2. Load your 17,251 villages dataset
df = pd.read_csv("ap_villages_final.csv")

# 3. Spatial nearest neighbor search (find the closest village in your dataset)
village_coords = np.radians(df[["latitude", "longitude"]].values)
tree = cKDTree(village_coords)

results = []
for station in ground_truth:
    st_coord = np.radians([station["lat"], station["lon"]])
    dist, idx = tree.query(st_coord)
    
    # Distance in km on earth surface (~6371 km radius)
    dist_km = dist * 6371.0
    matched_village = df.iloc[idx]
    
    results.append({
        "benchmark": station["name"],
        "survey_elev_m": station["survey_elev"],
        "matched_village": matched_village["town_village_name"],
        "village_elev_m": matched_village["elevation_m"],
        "distance_km": round(dist_km, 2),
        "elev_diff_m": round(matched_village["elevation_m"] - station["survey_elev"], 1)
    })

bench_df = pd.DataFrame(results)
print(bench_df.to_string(index=False))

mae = np.mean(np.abs(bench_df["elev_diff_m"]))
rmse = np.sqrt(np.mean(bench_df["elev_diff_m"]**2))
print(f"\n--- ALOS DEM / VILLAGE TERRAIN ACCURACY ---")
print(f"Mean Absolute Error (MAE): {mae:.2f} meters")
print(f"Root Mean Square Error (RMSE): {rmse:.2f} meters")