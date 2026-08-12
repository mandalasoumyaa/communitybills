from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Optional
from datetime import date, datetime
import uuid
import time
from sqlalchemy.orm import Session

try:
    from backend.database import get_db
    from backend import models
except ModuleNotFoundError:
    from database import get_db
    import models

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

@router.get("/expense-categories", response_model=List[ExpenseCategory])
def get_categories():
    return CATEGORIES

@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(community_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Expense)
    if community_id is not None:
        query = query.filter(models.Expense.community_id == community_id)
    expenses = query.order_by(models.Expense.date.desc()).all()
    return expenses

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = models.Expense(
        id=str(uuid.uuid4()),
        community_id=expense.community_id,
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
        status="Paid"
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: str, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


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
