import os
import geopandas as gpd
import pandas as pd
import rasterio
from rasterio.merge import merge

# File Paths
north_dem = "ap_north.tif"
south_dem = "ap_south.tif"
merged_dem = "ap_dem_merged.tif"
gpkg_path = "village_modified.gpkg"
output_csv = "ap_villages_master.csv"

# --- 1. MERGE NORTH & SOUTH DEM TILES ---
if not os.path.exists(merged_dem):
    print("Step 1/4: Merging North and South DEM tiles into one...")
    src_tiles = [rasterio.open(north_dem), rasterio.open(south_dem)]
    mosaic, out_trans = merge(src_tiles)

    out_meta = src_tiles[0].meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": out_trans,
        "compress": "lzw"
    })

    with rasterio.open(merged_dem, "w", **out_meta) as dest:
        dest.write(mosaic)

    for src in src_tiles:
        src.close()
    print(f"Merged DEM saved to: {merged_dem}")
else:
    print(f"Found existing {merged_dem}, skipping DEM merge.")

# --- 2. LOAD & FILTER ANDHRA PRADESH VILLAGES ---
print("\nStep 2/4: Reading village boundaries from GeoPackage (takes ~1-2 min)...")
gdf = gpd.read_file(gpkg_path)
print(f"Total features loaded: {len(gdf)}")
print("Available columns:", list(gdf.columns))

# Census 2011 State ID for undivided Andhra Pradesh is '28'
state_col = None
for candidate in ["pc11_state_id", "state_id", "pc01_state_id"]:
    if candidate in gdf.columns:
        state_col = candidate
        break

if state_col:
    print(f"Filtering records using '{state_col}' == '28'...")
    ap_gdf = gdf[gdf[state_col].astype(str).str.zfill(2) == "28"].copy()
else:
    print("State ID column not found directly. Searching text values for 'Andhra'...")
    mask = gdf.astype(str).apply(lambda row: row.str.contains("Andhra", case=False).any(), axis=1)
    ap_gdf = gdf[mask].copy()

print(f"Filtered {len(ap_gdf)} villages for Andhra Pradesh.")

# Convert projection to standard WGS84 Lat/Lon (EPSG:4326)
if ap_gdf.crs is None or ap_gdf.crs.to_epsg() != 4326:
    print("Reprojecting geometries to EPSG:4326...")
    ap_gdf = ap_gdf.to_crs(epsg=4326)

# --- 3. CALCULATE VILLAGE CENTROIDS ---
print("\nStep 3/4: Calculating centroid coordinates (latitude, longitude)...")
centroids = ap_gdf.geometry.centroid
ap_gdf["longitude"] = centroids.x.round(6)
ap_gdf["latitude"] = centroids.y.round(6)

# --- 4. EXTRACT 30M ELEVATION AT CENTROIDS ---
print("\nStep 4/4: Sampling elevation from merged DEM...")
with rasterio.open(merged_dem) as dem:
    coords = list(zip(ap_gdf["longitude"], ap_gdf["latitude"]))
    elevations = [val[0] for val in dem.sample(coords)]

ap_gdf["elevation_m"] = elevations
# Clean ocean / void / nodata values
ap_gdf["elevation_m"] = ap_gdf["elevation_m"].apply(lambda x: 0.0 if x < -100 else round(float(x), 1))

# Drop geometry polygons to keep CSV file lightweight
df_clean = ap_gdf.drop(columns=["geometry"])

# Save final dataset
df_clean.to_csv(output_csv, index=False)
print(f"\nSUCCESS! Master static dataset created: {output_csv}")
print(df_clean[["longitude", "latitude", "elevation_m"]].head(10))