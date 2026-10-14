import pandas as pd
import numpy as np
import pickle
import xgboost as xgb
from sklearn.model_selection import train_test_split

def train_and_save_xgboost():
    # 1. Load your spatial training dataset
    # Must contain: latitude, longitude, elevation_m, day_of_year, coarse_tmax, coarse_rain, actual_tmax, actual_rain
    locations_df = pd.read_csv("eluru_locations.csv")
    
    # Synthetic training distribution baseline if bootstrapping without multi-year AWS logs
    np.random.seed(42)
    n_samples = 1200
    
    # Feature sampling across seasonal cycles and regional NWP bounds
    sampled_locs = locations_df.sample(n=n_samples, replace=True).reset_index(drop=True)
    doy = np.random.randint(1, 366, size=n_samples)
    coarse_tmax = np.random.uniform(24.0, 44.0, size=n_samples)
    coarse_rain = np.random.exponential(scale=6.0, size=n_samples)
    
    # Topographic physics target: Environmental lapse rate (-6.5°C/km) + local terrain noise
    lapse_rate = -0.0065
    delta_temp = (sampled_locs["elevation_m"] * lapse_rate) + np.random.normal(0, 0.4, size=n_samples)
    
    # Orographic rainfall uplift in higher terrain
    orographic_factor = np.where(sampled_locs["elevation_m"] > 100, sampled_locs["elevation_m"] * 0.015, 0.0)
    delta_rain = orographic_factor + np.random.normal(0, 0.8, size=n_samples)
    
    X = pd.DataFrame({
        "latitude": sampled_locs["latitude"],
        "longitude": sampled_locs["longitude"],
        "elevation_m": sampled_locs["elevation_m"],
        "day_of_year": doy,
        "coarse_tmax": coarse_tmax,
        "coarse_rain": coarse_rain
    })
    
    y_temp_delta = delta_temp
    y_rain_delta = delta_rain
    
    # 2. XGBoost Regressor for Temperature Delta
    xgb_temp = xgb.XGBRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=4,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.1,    # L1 Regularisation
        reg_lambda=1.0,   # L2 Regularisation
        random_state=42
    )
    xgb_temp.fit(X, y_temp_delta)
    
    # 3. XGBoost Regressor for Precipitation Delta
    xgb_rain = xgb.XGBRegressor(
        n_estimators=120,
        learning_rate=0.04,
        max_depth=3,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.2,
        reg_lambda=1.2,
        random_state=42
    )
    xgb_rain.fit(X, y_rain_delta)
    
    # 4. Save to downscale_models.pkl
    with open("downscale_models.pkl", "wb") as f:
        pickle.dump({"tmax_model": xgb_temp, "rain_model": xgb_rain}, f)
        
    print("XGBoost models trained and saved to downscale_models.pkl successfully.")

if __name__ == "__main__":
    train_and_save_xgboost()