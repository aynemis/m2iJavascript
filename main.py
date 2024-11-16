from fastapi import FastAPI, HTTPException, Query,Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
from models import User, Account, Transaction, AccountBalanceUpdate, LoginHistory, LoginRequest
from uuid import uuid4
import re
import bcrypt
import httpx
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
# Initialize FastAPI app
app = FastAPI()

limiter = Limiter(key_func=get_remote_address)  # Uses IP address for rate limiting
app.state.limiter = limiter

origins = [
    "http://127.0.0.1:5500",  # Allow the frontend served from localhost:5500
    "http://localhost:5500",   # Allow other variations of localhost:5500
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of origins allowed to access the API
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Load data from db.json
def load_data():
    with open("db.json", "r", encoding="utf-8") as file:
        return json.load(file)

db = load_data()

def validate_password(password: str) -> bool:
    password_regex = re.compile(r'^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$')
    if not password_regex.match(password):
        return False
    return True

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

@app.get("/users", response_model=List[User])
def get_users_by_email(email: Optional[str] = None):
    if email:
        filtered_users = [user for user in db["users"] if user["email"] == email]
        if filtered_users:
            return filtered_users
        raise HTTPException(status_code=404, detail="User not found")
    return db["users"]

@app.post("/login")
@limiter.limit("5/minute")  # Limit to 5 requests per minute from the same IP
async def login(request: Request, request_data: LoginRequest):  # Accept 'request' here
    # Find user by email
    stored_user = next((u for u in db["users"] if u["email"] == request_data.email), None)
    if not stored_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Compare password with stored hash
    if not bcrypt.checkpw(request_data.password.encode('utf-8'), stored_user["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid password")

    # Return success and any needed user details
    return {"message": "Login successful", "userId": stored_user["id"], "name": stored_user["name"]}

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: str):
    user = next((u for u in db["users"] if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def validate_email(email: str) -> bool:
    """Check if the email is in a valid format."""
    email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return email_regex.match(email) is not None


@app.post("/users", response_model=User)
def create_user(user: User):
    # Check if the email already exists
    if any(u['email'] == user.email for u in db["users"]):
        raise HTTPException(status_code=400, detail="Email already registered")
    
     # Validate the email format
    if not validate_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Validate the password
    if not validate_password(user.password):
        raise HTTPException(status_code=400, detail="Password must be at least 12 characters long, with at least one number, one uppercase letter, and one special character.")

    # Hash the password
    hashed_password = hash_password(user.password)

    # Create the user with the hashed password
    user_dict = user.dict()
    user_dict["password"] = hashed_password  # Store the hashed password
    user_dict["id"] = str(uuid4())  # Generate a unique user ID
    
    db["users"].append(user_dict)

    # Save the updated db.json file
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)

    return user

@app.put("/users/{user_id}", response_model=User)
def update_user(user_id: str, updated_user: User):
    # Find the user by ID
    user = next((u for u in db["users"] if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Debugging: Check if the alertThreshold is correctly passed
    print(f"Updated user data: {updated_user}")

    # Update user information (name, email, alertThreshold)
    user["name"] = updated_user.name
    user["email"] = updated_user.email
    user["alertThreshold"] = updated_user.alertThreshold  # Make sure this is being set correctly

    # Save the updated db to the file
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)

    return user


@app.delete("/users/{user_id}", response_model=dict)
def delete_user(user_id: str):
    # Find the user by ID
    user_index = next((index for index, u in enumerate(db["users"]) if u["id"] == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove the user from the database
    db["users"].pop(user_index)

    # Save the updated db to the file
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)

    return {"message": "User deleted successfully"}

@app.get("/accounts", response_model=List[Account])
def get_accounts(userId: Optional[str] = Query(None)):
    if userId:
        filtered_accounts = [account for account in db["accounts"] if account["userId"] == userId]
        return filtered_accounts
    return db["accounts"]

@app.get("/accounts/{account_id}", response_model=Account)
def get_account(account_id: str):
    # Find the account by account_id
    account = next((acc for acc in db["accounts"] if acc["id"] == account_id), None)
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return account

@app.post("/accounts", response_model=Account)
def create_account(account: Account):
    account_dict = account.dict()
    account_dict["id"] = str(uuid4())  # Assign unique ID
    db["accounts"].append(account_dict)
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)
    return account

@app.delete("/accounts/{account_id}", response_model=dict)
def delete_account(account_id: str):
    account_index = next((index for (index, acc) in enumerate(db["accounts"]) if acc["id"] == account_id), None)
    if account_index is None:
        raise HTTPException(status_code=404, detail="Account not found")
    db["accounts"].pop(account_index)
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)
    return {"message": "Account deleted successfully"}

@app.get("/transactions", response_model=List[Transaction])
def get_transactions(userId: Optional[str] = Query(None)):
    if userId:
        filtered_transactions = [transaction for transaction in db["transactions"]
                                 if transaction["fromUserId"] == userId or transaction["toUserId"] == userId]
        return filtered_transactions
    return db["transactions"]

@app.post("/transactions", response_model=Transaction)
def create_transaction(transaction: Transaction):
    transaction_dict = transaction.dict()
    transaction_dict["id"] = str(uuid4())  # Assign unique ID
    db["transactions"].append(transaction_dict)
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)
    return transaction



@app.patch("/accounts/{account_id}", response_model=Account)
def update_account_balance(account_id: str, update_data: AccountBalanceUpdate):
    # Find the account by its ID
    account = next((acc for acc in db["accounts"] if acc["id"] == account_id), None)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Update the balance
    account["balance"] = update_data.balance

    # Save the updated database to the file
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)

    return account


@app.post("/loginHistory", response_model=dict)
def create_login_history(login_history: LoginHistory):
    login_history_dict = login_history.dict()
    login_history_dict["id"] = str(uuid4())  # Assign unique ID for the login history
    db["loginHistory"].append(login_history_dict)
    with open("db.json", "w", encoding="utf-8") as file:
        json.dump(db, file, ensure_ascii=False, indent=4)
    return {"message": "Login history recorded successfully"}

@app.get("/loginHistory", response_model=List[LoginHistory])
def get_login_history(userId: Optional[str] = Query(None)):
    if userId:
        # Filter login history by userId
        filtered_history = [entry for entry in db["loginHistory"] if entry["userId"] == userId]
        return filtered_history
    else:
        raise HTTPException(status_code=400, detail="UserId is required")
    
@app.get("/get-ip-location")
async def get_ip_location():
    try:
        # Make the request to the external API
        async with httpx.AsyncClient() as client:
            response = await client.get('https://ipwhois.app/json/')
            data = response.json()
            return data  # Send the response from the external API back to the frontend
    except Exception as e:
        return {"error": "Unable to fetch IP and location", "message": str(e)}