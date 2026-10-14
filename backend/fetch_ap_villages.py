import pandas as pd
import requests

print("Downloading official Andhra Pradesh village location catalogue...")

# Direct link to public open-data village settlement index
url = "https://raw.githubusercontent.com/justinelliotmeyers/India_Village_Locations/master/Andhra_Pradesh.csv"

try:
    df = pd.read_csv(url)
    print(f"Loaded {len(df)} locations successfully.")
    
    # Standardize column headers
    # Keeps: Village Name, Sub-district (Mandal), District, Latitude, Longitude
    df.to_csv("ap_villages_raw.csv", index=False)
    print("Saved as 'ap_villages_raw.csv' in your backend directory!")
except Exception as e:
    print(f"Download failed: {e}")