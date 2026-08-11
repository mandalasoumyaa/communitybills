from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud, schemas, models
from services import calculation
from pydantic import BaseModel

router = APIRouter(tags=["Bills"])

class BillCalculationRequest(BaseModel):
    previous_reading: float
    current_reading: float
    rate_per_litre: float = 0.575

class BillGenerationRequest(BaseModel):
    month: str
    rate_per_litre: float = 0.575
    maintenance: float = 250.0

@router.post("/calculate")
def calculate_reading_cost(payload: BillCalculationRequest):
    """
    Performs transient calculations without saving to database.
    """
    if payload.current_reading < payload.previous_reading:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current reading cannot be lower than the previous reading."
        )
    try:
        units = calculation.calculate_consumption_units(payload.current_reading, payload.previous_reading)
        litres = calculation.calculate_litres(units)
        cost = calculation.calculate_water_cost(litres, payload.rate_per_litre)
        return {
            "units": units,
            "litres": litres,
            "water_cost": cost
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-bills")
def trigger_bill_generation(payload: BillGenerationRequest, db: Session = Depends(get_db)):
    """
    Generates bills in database for all complete readings of a month.
    """
    try:
        count = crud.generate_bills(
            db, 
            month=payload.month, 
            rate_per_litre=payload.rate_per_litre, 
            maintenance=payload.maintenance
        )
        return {"message": f"Successfully generated/updated {count} bills for {payload.month}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bills")
def read_bills(db: Session = Depends(get_db)):
    """
    Fetch all generated bills.
    """
    bills = db.query(models.Bill).all()
    response_items = []
    for b in bills:
        response_items.append({
            "id": b.id,
            "apartment_id": b.apartment_id,
            "apartment_number": b.apartment.apartment_number,
            "water_cost": b.water_cost,
            "maintenance": b.maintenance,
            "total": b.total,
            "paid": b.paid,
            "due_date": b.due_date
        })
    return response_items

@router.get("/bill/{id}")
def read_bill(id: int, db: Session = Depends(get_db)):
    """
    Retrieve details of a single bill.
    """
    b = db.query(models.Bill).filter(models.Bill.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    return {
        "id": b.id,
        "apartment_id": b.apartment_id,
        "apartment_number": b.apartment.apartment_number,
        "water_cost": b.water_cost,
        "maintenance": b.maintenance,
        "total": b.total,
        "paid": b.paid,
        "due_date": b.due_date
    }
