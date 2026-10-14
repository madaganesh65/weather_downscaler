import pickle
import pandas as pd
import numpy as np
from datetime import datetime

# Load pre-trained XGBoost models and geodata
with open("downscale_models.pkl", "rb") as f:
    MODELS = pickle.load(f)

LOCATIONS_DF = pd.read_csv("eluru_locations.csv")

def run_downscaling(coarse_temp: float, coarse_rain: float):
    """
    Applies Extreme Gradient Boosting (XGBoost) residual regression 
    to downscale regional inputs to mandal-level microclimates.
    """
    day_of_year = datetime.now().timetuple().tm_yday
    
    # Build feature matrix matching the trained XGBoost model schema
    features = pd.DataFrame({
        "latitude": LOCATIONS_DF["latitude"],
        "longitude": LOCATIONS_DF["longitude"],
        "elevation_m": LOCATIONS_DF["elevation_m"],
        "day_of_year": day_of_year,
        "coarse_tmax": coarse_temp,
        "coarse_rain": coarse_rain
    })
    
    result = LOCATIONS_DF.copy()
    
    # Predict residuals using the XGBoost models
    temp_residuals = MODELS["tmax_model"].predict(features)
    rain_residuals = MODELS["rain_model"].predict(features)
    
    # Reconstruct localized estimates: Baseline + Predicted Residual
    result["downscaled_tmax"] = np.round(coarse_temp + temp_residuals, 2)
    result["downscaled_rain"] = np.round(np.clip(coarse_rain + rain_residuals, 0, None), 2)
    result["temp_delta"] = np.round(temp_residuals, 2)
    result["rain_delta"] = np.round(result["downscaled_rain"] - coarse_rain, 2)
    
    return result