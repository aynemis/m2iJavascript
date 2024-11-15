from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    password: str
    alertThreshold: Optional[int] = None

class Account(BaseModel):
    id: Optional[str] = None
    userId: str
    name: str
    type: str
    balance: float

class Transaction(BaseModel):
    id: Optional[str] = None
    fromUserId: str
    toUserId: str
    fromAccountId: str
    toAccountId: str
    amount: float
    date: str
    transferType: str
    description: str
    senderBalanceAfter: float
    recipientBalanceAfter: float

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AccountBalanceUpdate(BaseModel):
    balance: float

class LoginHistory(BaseModel):
    id: Optional[str] = None
    userId: str
    date: str
    ipAddress: str
    location: str
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class LoginRequest(BaseModel):
    email: str
    password: str