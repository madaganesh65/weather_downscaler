from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from database import get_db_connection

router = APIRouter()

# --- Request Payloads ---
class LoginPayload(BaseModel):
    identifier: str
    password: str

class RegisterPayload(BaseModel):
    name: str
    identifier: str
    role: str
    district: str
    mandal: str
    village: str
    idProof: str
    password: str

class StatusPayload(BaseModel):
    user_id: int
    status: str

# --- Endpoints ---

@router.post("/api/auth/register")
def register_user(payload: RegisterPayload):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM users WHERE LOWER(identifier) = LOWER(%s);", (payload.identifier.strip(),))
        if cur.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="An account with this Mobile or Email already exists.")

        cur.execute("""
            INSERT INTO users (full_name, identifier, role, district, mandal, village, id_proof, password, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id;
        """, (
            payload.name.strip(),
            payload.identifier.strip(),
            payload.role,
            payload.district,
            payload.mandal.strip(),
            payload.village.strip(),
            payload.idProof.strip(),
            payload.password
        ))
        new_id = cur.fetchone()["id"]
        conn.commit()
    conn.close()

    return {"message": "Application submitted successfully. Awaiting District Admin approval.", "id": new_id}


@router.post("/api/auth/login")
def login_user(payload: LoginPayload):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM users WHERE LOWER(identifier) = LOWER(%s);", (payload.identifier.strip(),))
        user = cur.fetchone()
    conn.close()

    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid mobile/email or password.")

    if user["status"] == "pending":
        raise HTTPException(
            status_code=403, 
            detail="Account pending verification. District Administrator approval is required before logging in."
        )

    if user["status"] == "rejected":
        raise HTTPException(
            status_code=403, 
            detail="Your registration application was reviewed and rejected by the Administrator."
        )

    return {
        "id": user["id"],
        "name": user["full_name"],
        "identifier": user["identifier"],
        "role": user["role"],
        "district": user["district"],
        "mandal": user["mandal"],
        "village": user["village"],
        "status": user["status"]
    }


@router.get("/api/admin/pending-users")
def get_pending_users():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, full_name AS name, identifier, role, district, mandal, village, id_proof, created_at 
            FROM users 
            WHERE status = 'pending' 
            ORDER BY created_at DESC;
        """)
        pending = cur.fetchall()
    conn.close()
    return pending


@router.post("/api/admin/set-status")
def set_user_status(payload: StatusPayload):
    if payload.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'.")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor() as cur:
        cur.execute("UPDATE users SET status = %s WHERE id = %s;", (payload.status, payload.user_id))
        conn.commit()
    conn.close()

    return {"message": f"User status successfully updated to {payload.status}."}