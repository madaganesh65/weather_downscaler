from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from database import get_db_connection
from typing import Optional

router = APIRouter()

# ----------------- Request Schemas -----------------
class RegisterPayload(BaseModel):
    name: str
    identifier: str
    role: str  # farmer, supplier, consumer
    district: str
    mandal: str
    village: str
    idProof: Optional[str] = None
    password: str

class LoginPayload(BaseModel):
    identifier: str
    password: str

class ProductPayload(BaseModel):
    supplier_id: int
    product_name: str
    category: str  # Pesticide, Fertilizer, Seed
    brand: Optional[str] = "Generic"
    stock_quantity: int
    unit: str
    price_per_unit: float
    description: Optional[str] = ""

class ProducePayload(BaseModel):
    farmer_id: int
    crop_name: str
    variety: Optional[str] = "Standard"
    quantity_available: float
    unit: str
    expected_price: float

class MessagePayload(BaseModel):
    sender_id: int
    receiver_id: int
    message: str

class StatusPayload(BaseModel):
    user_id: int
    status: str

# ----------------- Authentication & Crowdsource Logging -----------------

@router.post("/api/auth/register")
def register_user(payload: RegisterPayload):
    if payload.role not in ['farmer', 'supplier', 'consumer']:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    # Consumers are active immediately. Farmers & Suppliers require verification.
    initial_status = "approved" if payload.role == "consumer" else "pending"

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM users WHERE LOWER(identifier) = LOWER(%s);", (payload.identifier.strip(),))
        if cur.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Phone or Email already registered.")

        # 1. Insert User
        cur.execute("""
            INSERT INTO users (full_name, identifier, role, district, mandal, village, id_proof, password, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            payload.name.strip(),
            payload.identifier.strip(),
            payload.role,
            payload.district.strip(),
            payload.mandal.strip(),
            payload.village.strip(),
            payload.idProof.strip() if payload.idProof else None,
            payload.password,
            initial_status
        ))
        new_id = cur.fetchone()["id"]

        # 2. Feed Crowdsourced Village-Mandal data for spatial mapping/training
        cur.execute("""
            INSERT INTO spatial_corrections (raw_village_input, raw_mandal_input, raw_district_input)
            VALUES (%s, %s, %s);
        """, (payload.village.strip(), payload.mandal.strip(), payload.district.strip()))

        conn.commit()
    conn.close()

    msg = "Account created and ready!" if initial_status == "approved" else "Application registered. Awaiting District Admin approval."
    return {"message": msg, "user_id": new_id, "status": initial_status}


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
        raise HTTPException(status_code=401, detail="Invalid phone/email or password.")

    if user["status"] == "pending":
        raise HTTPException(status_code=403, detail="Account is pending verification by District Administrator.")

    if user["status"] == "rejected":
        raise HTTPException(status_code=403, detail="Application was rejected by the Administrator.")

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

# ----------------- Admin Hub Endpoints -----------------

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
        users = cur.fetchall()
    conn.close()
    return users


@router.post("/api/admin/set-status")
def set_user_status(payload: StatusPayload):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor() as cur:
        cur.execute("UPDATE users SET status = %s WHERE id = %s;", (payload.status, payload.user_id))
        conn.commit()
    conn.close()
    return {"message": f"User status set to {payload.status}."}


@router.get("/api/admin/spatial-submissions")
def get_spatial_submissions():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM spatial_corrections ORDER BY created_at DESC LIMIT 50;")
        records = cur.fetchall()
    conn.close()
    return records

# ----------------- Supplier Inventory Endpoints -----------------

@router.get("/api/products")
def list_all_products(category: Optional[str] = None):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if category:
            cur.execute("""
                SELECT p.*, u.full_name AS supplier_name, u.district, u.mandal, u.identifier AS supplier_contact
                FROM supplier_products p
                JOIN users u ON p.supplier_id = u.id
                WHERE p.category = %s AND p.stock_quantity > 0;
            """, (category,))
        else:
            cur.execute("""
                SELECT p.*, u.full_name AS supplier_name, u.district, u.mandal, u.identifier AS supplier_contact
                FROM supplier_products p
                JOIN users u ON p.supplier_id = u.id
                WHERE p.stock_quantity > 0;
            """)
        products = cur.fetchall()
    conn.close()
    return products


@router.post("/api/products/add")
def add_supplier_product(payload: ProductPayload):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO supplier_products (supplier_id, product_name, category, brand, stock_quantity, unit, price_per_unit, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
        """, (
            payload.supplier_id, payload.product_name, payload.category, payload.brand,
            payload.stock_quantity, payload.unit, payload.price_per_unit, payload.description
        ))
        prod_id = cur.fetchone()["id"]
        conn.commit()
    conn.close()
    return {"message": "Product stock added successfully.", "product_id": prod_id}

# ----------------- Farmer Produce Endpoints (For Consumers) -----------------

@router.get("/api/produce")
def list_farmer_produce():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT fp.*, u.full_name AS farmer_name, u.district, u.mandal, u.village, u.identifier AS farmer_contact
            FROM farmer_produce fp
            JOIN users u ON fp.farmer_id = u.id
            WHERE fp.status = 'active';
        """)
        crops = cur.fetchall()
    conn.close()
    return crops


@router.post("/api/produce/add")
def add_farmer_produce(payload: ProducePayload):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO farmer_produce (farmer_id, crop_name, variety, quantity_available, unit, expected_price)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;
        """, (
            payload.farmer_id, payload.crop_name, payload.variety,
            payload.quantity_available, payload.unit, payload.expected_price
        ))
        c_id = cur.fetchone()["id"]
        conn.commit()
    conn.close()
    return {"message": "Harvest produce listed for buyers.", "produce_id": c_id}

# ----------------- Farmer <-> Supplier Advisory Chat -----------------

@router.get("/api/chat/contacts/{user_id}")
def get_chat_contacts(user_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Get target user's role
        cur.execute("SELECT role FROM users WHERE id = %s;", (user_id,))
        usr = cur.fetchone()
        if not usr:
            conn.close()
            return []

        # If farmer, get all suppliers; if supplier, get all farmers
        opp_role = 'supplier' if usr["role"] == 'farmer' else 'farmer'
        cur.execute("""
            SELECT id, full_name, role, district, mandal, identifier 
            FROM users 
            WHERE role = %s AND status = 'approved'
            ORDER BY full_name ASC;
        """, (opp_role,))
        contacts = cur.fetchall()
    conn.close()
    return contacts


@router.get("/api/chat/messages")
def get_chat_history(user_a: int = Query(...), user_b: int = Query(...)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, sender_id, receiver_id, message, created_at
            FROM chat_messages
            WHERE (sender_id = %s AND receiver_id = %s)
               OR (sender_id = %s AND receiver_id = %s)
            ORDER BY created_at ASC;
        """, (user_a, user_b, user_b, user_a))
        messages = cur.fetchall()
    conn.close()
    return messages


@router.post("/api/chat/send")
def send_message(payload: MessagePayload):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO chat_messages (sender_id, receiver_id, message)
            VALUES (%s, %s, %s) RETURNING id, created_at;
        """, (payload.sender_id, payload.receiver_id, payload.message.strip()))
        row = cur.fetchone()
        conn.commit()
    conn.close()
    return {"message_id": row["id"], "created_at": str(row["created_at"])}