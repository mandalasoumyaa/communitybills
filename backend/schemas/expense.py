from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class ExpenseCategory(BaseModel):
    id: str
    name: str
    icon: str  # Name of the icon, e.g. "electricity", "water", etc.

class ExpenseCreate(BaseModel):
    community_id: Optional[int] = None
    category: str
    date: date
    amount: float
    paymentMode: str
    vendor: str
    referenceNumber: Optional[str] = None
    paidFromAccount: str
    apartment: Optional[str] = None
    description: str
    notes: Optional[str] = None
    recurring: bool = False
    receiptUrl: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    community_id: Optional[int] = None
    category: str
    date: date
    amount: float
    paymentMode: str
    vendor: str
    referenceNumber: Optional[str] = None
    paidFromAccount: str
    apartment: Optional[str] = None
    description: str
    notes: Optional[str] = None
    recurring: bool
    receiptUrl: Optional[str] = None
    status: str  # e.g., "Paid", "Pending", "Draft"

class OcrResponse(BaseModel):
    category: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    referenceNumber: Optional[str] = None
    description: Optional[str] = None

class AiSuggestionResponse(BaseModel):
    suggestedCategory: str
    suggestedVendor: str
    budgetStatus: str
    recurringExpense: bool
    confidence: float
