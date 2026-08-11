from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from datetime import date, datetime
import uuid
import time
try:
    from backend.schemas import ExpenseCategory, ExpenseCreate, ExpenseResponse, OcrResponse, AiSuggestionResponse
except ModuleNotFoundError:
    from schemas import ExpenseCategory, ExpenseCreate, ExpenseResponse, OcrResponse, AiSuggestionResponse

router = APIRouter()

# In-memory database seeds
CATEGORIES = [
    ExpenseCategory(id="electricity", name="Electricity", icon="electricity"),
    ExpenseCategory(id="water_tanker", name="Water Tanker", icon="water"),
    ExpenseCategory(id="security", name="Security", icon="security"),
    ExpenseCategory(id="salaries", name="Salaries", icon="salaries"),
    ExpenseCategory(id="repairs", name="Repairs", icon="repairs"),
    ExpenseCategory(id="materials", name="Materials", icon="materials"),
    ExpenseCategory(id="other", name="Other", icon="other"),
]

EXPENSES_DB = [
    ExpenseResponse(
        id=str(uuid.uuid4()),
        category="security",
        date=date(2025, 4, 25),
        amount=18500.0,
        paymentMode="Bank Transfer",
        vendor="Security Agency",
        referenceNumber="REF-SEC-0425",
        paidFromAccount="SBI - Main Account",
        apartment="All",
        description="Security Agency Monthly Payment",
        recurring=True,
        status="Paid"
    ),
    ExpenseResponse(
        id=str(uuid.uuid4()),
        category="water_tanker",
        date=date(2025, 4, 25),
        amount=6000.0,
        paymentMode="Cash",
        vendor="Water Supply Corp",
        referenceNumber="REF-WAT-0425",
        paidFromAccount="Petty Cash",
        apartment="Block A",
        description="5 Water Tankers",
        recurring=False,
        status="Paid"
    ),
    ExpenseResponse(
        id=str(uuid.uuid4()),
        category="electricity",
        date=date(2025, 4, 28),
        amount=9748.0,
        paymentMode="Bank Transfer",
        vendor="TSNPDCL",
        referenceNumber="EB/2025/04/1102",
        paidFromAccount="SBI - Main Account",
        apartment="Common Area",
        description="Electricity bill for Common Area",
        recurring=True,
        status="Paid"
    ),
]

@router.get("/expense-categories", response_model=List[ExpenseCategory])
def get_categories():
    return CATEGORIES

@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses():
    # Return last 5 expenses, sorted by date descending
    sorted_expenses = sorted(EXPENSES_DB, key=lambda x: x.date, reverse=True)
    return sorted_expenses[:5]

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate):
    new_expense = ExpenseResponse(
        id=str(uuid.uuid4()),
        category=expense.category,
        date=expense.date,
        amount=expense.amount,
        paymentMode=expense.paymentMode,
        vendor=expense.vendor,
        referenceNumber=expense.referenceNumber,
        paidFromAccount=expense.paidFromAccount,
        apartment=expense.apartment,
        description=expense.description,
        notes=expense.notes,
        recurring=expense.recurring,
        receiptUrl=expense.receiptUrl,
        status="Paid"  # default status
    )
    EXPENSES_DB.append(new_expense)
    return new_expense

@router.post("/upload-receipt")
async def upload_receipt(file: UploadFile = File(...)):
    # Simulating upload
    file_extension = file.filename.split(".")[-1]
    simulated_url = f"/uploads/{uuid.uuid4()}.{file_extension}"
    return {
        "filename": file.filename,
        "url": simulated_url,
        "status": "success",
        "size": 102450  # Mock size
    }

@router.post("/ocr/extract", response_model=OcrResponse)
def ocr_extract(payload: dict):
    # Simulating OCR extraction
    # Using real mock values representing the TSNPDCL bill
    return OcrResponse(
        category="electricity",
        vendor="TSNPDCL",
        amount=9850.00,
        date=date(2025, 5, 2),
        referenceNumber="EB/2025/05/1287",
        description="Electricity bill payment for common area - May 2025"
    )

@router.post("/ai/suggestions", response_model=AiSuggestionResponse)
def ai_suggestions(payload: dict):
    # Return mock recommendations
    return AiSuggestionResponse(
        suggestedCategory="electricity",
        suggestedVendor="TSNPDCL",
        budgetStatus="Within Budget (Remaining: ₹15,150.00)",
        recurringExpense=True,
        confidence=0.96
    )
