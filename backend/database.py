import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "ap_weather_db",
    "user": "postgres",
    "password": "Ganesh@123",  # Set your pgAdmin master password here
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    """Establishes and returns a connection to PostgreSQL."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"[Database Error]: Could not connect to PostgreSQL: {e}")
        return None