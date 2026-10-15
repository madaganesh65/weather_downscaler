import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "ap_weather_db",
    "user": "postgres",
    "password": "admin123",
    "host": "127.0.0.1",
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