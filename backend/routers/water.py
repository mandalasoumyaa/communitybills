from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import crud, schemas, models

router = APIRouter(prefix="/water-readings", tags=["Water Readings"])

@router.get("")
def read_water_readings(
    month: str = "May 2026",
    search: str = "",
    floor: str = "All",
    status: str = "All",
    skip: int = 0,
    limit: int = 100,
    sort_col: str = "apartment_number",
    sort_dir: str = "asc",
    db: Session = Depends(get_db)
):
    """
    Fetch water readings with search, floor, and status filters, sorting, and pagination.
    """
    readings, total = crud.get_water_readings(
        db, month=month, search=search, floor=floor, status=status,
        skip=skip, limit=limit, sort_col=sort_col, sort_dir=sort_dir
    )
    
    # Format response
    response_items = []
    for r in readings:
        response_items.append({
            "id": r.id,
            "apartment_id": r.apartment_id,
            "apartment_number": r.apartment.apartment_number,
            "month": r.month,
            "previous_reading": r.previous_reading,
            "current_reading": r.current_reading,
            "units": r.units,
            "litres": r.litres,
            "water_cost": r.water_cost,
            "status": r.status,
            "created_at": r.created_at
        })
        
    return {
        "items": response_items,
        "total": total,
        "page": (skip // limit) + 1,
        "pages": (total + limit - 1) // limit
    }

@router.post("", response_model=schemas.WaterReadingResponse)
def create_reading(
    payload: schemas.WaterReadingCreate,
    rate_per_litre: float = 0.575,
    db: Session = Depends(get_db)
):
    """
    Create a new manual reading entry. Performs safety checks.
    """
    # Verify apartment exists
    apartment = db.query(models.Apartment).filter(models.Apartment.id == payload.apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Apartment ID {payload.apartment_id} not found."
        )

    # Check validation
    if payload.current_reading is not None:
        if payload.current_reading < payload.previous_reading:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current reading cannot be lower than the previous reading."
            )
        if payload.current_reading < 0 or payload.previous_reading < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reading values cannot be negative."
            )

    try:
        reading = crud.create_or_update_reading(
            db, 
            apartment_id=payload.apartment_id,
            month=payload.month,
            previous_reading=payload.previous_reading,
            current_reading=payload.current_reading,
            rate_per_litre=rate_per_litre
        )
        
        # Determine transient status attribute
        if reading.current_reading is None:
            r_status = "Pending"
        elif reading.current_reading < reading.previous_reading:
            r_status = "Missing"
        else:
            r_status = "Completed"
            
        return {
            "id": reading.id,
            "apartment_id": reading.apartment_id,
            "apartment_number": apartment.apartment_number,
            "month": reading.month,
            "previous_reading": reading.previous_reading,
            "current_reading": reading.current_reading,
            "units": reading.units,
            "litres": reading.litres,
            "water_cost": reading.water_cost,
            "status": r_status,
            "created_at": reading.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/update-rate")
def update_rate_for_month(
    month: str = "May 2026",
    rate_per_litre: float = 0.575,
    db: Session = Depends(get_db)
):
    """
    Recalculate water cost for all readings in a given month using the new rate.
    """
    try:
        if rate_per_litre <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation Error: Billing rate must be a positive number."
            )

        # 1. Save or update the rate in the water_rates table
        rate_entry = db.query(models.WaterRate).filter(models.WaterRate.month == month).first()
        if rate_entry:
            rate_entry.rate_per_litre = rate_per_litre
        else:
            rate_entry = models.WaterRate(month=month, rate_per_litre=rate_per_litre)
            db.add(rate_entry)
        
        # 2. Recalculate cost for all readings in this month
        readings = db.query(models.WaterReading).filter(models.WaterReading.month == month).all()
        for r in readings:
            if r.current_reading is not None:
                r.units = max(0.0, r.current_reading - r.previous_reading)
                r.litres = r.units * 10.0
                r.water_cost = round(r.litres * rate_per_litre)
                
                # 3. Update the corresponding Bill records if any exist
                bill_record = db.query(models.Bill).filter(models.Bill.apartment_id == r.apartment_id).first()
                if bill_record:
                    bill_record.water_cost = r.water_cost
                    bill_record.total = r.water_cost + bill_record.maintenance
                    
        db.commit()

        # Query and return the updated readings for this month
        db.expire_all()
        updated_readings = db.query(models.WaterReading).filter(models.WaterReading.month == month).all()
        
        response_items = []
        for r in updated_readings:
            if r.current_reading is None:
                r_status = "Pending"
            elif r.current_reading < r.previous_reading:
                r_status = "Missing"
            else:
                r_status = "Completed"
                
            response_items.append({
                "id": r.id,
                "apartment_id": r.apartment_id,
                "apartment_number": r.apartment.apartment_number,
                "month": r.month,
                "previous_reading": r.previous_reading,
                "current_reading": r.current_reading,
                "units": r.units,
                "litres": r.litres,
                "water_cost": r.water_cost,
                "status": r_status,
                "created_at": r.created_at
            })
            
        return {"items": response_items, "message": f"Successfully updated rate to {rate_per_litre} for {month}."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{id}")
def update_reading_value(
    id: int,
    payload: schemas.WaterReadingUpdate,
    rate_per_litre: float = 0.575,
    db: Session = Depends(get_db)
):
    """
    Update the current reading of an existing entry (used during Excel-like table cell edit/paste).
    """
    reading = db.query(models.WaterReading).filter(models.WaterReading.id == id).first()
    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Water reading entry with ID {id} not found."
        )

    if payload.current_reading is not None:
        if payload.current_reading < reading.previous_reading:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation Error: Current reading ({payload.current_reading}) must be greater than or equal to previous ({reading.previous_reading})."
            )

    try:
        if payload.water_cost is not None:
            reading.water_cost = payload.water_cost
            if payload.current_reading is not None:
                reading.current_reading = payload.current_reading
                reading.units = max(0.0, payload.current_reading - reading.previous_reading)
                reading.litres = reading.units * 10.0
            else:
                # If current reading is not set, set it to previous so it's completed
                if reading.current_reading is None:
                    reading.current_reading = reading.previous_reading
                    reading.units = 0.0
                    reading.litres = 0.0
            db.commit()
            db.refresh(reading)
            if reading.current_reading is not None:
                crud.propagate_reading_forward(db, reading.apartment_id, reading.month, reading.current_reading)
            updated = reading
        else:
            updated = crud.create_or_update_reading(
                db,
                apartment_id=reading.apartment_id,
                month=reading.month,
                previous_reading=reading.previous_reading,
                current_reading=payload.current_reading,
                rate_per_litre=rate_per_litre
            )
        
        r_status = "Completed" if updated.current_reading is not None else "Pending"
        
        return {
            "id": updated.id,
            "apartment_id": updated.apartment_id,
            "apartment_number": updated.apartment.apartment_number,
            "month": updated.month,
            "previous_reading": updated.previous_reading,
            "current_reading": updated.current_reading,
            "units": updated.units,
            "litres": updated.litres,
            "water_cost": updated.water_cost,
            "status": r_status,
            "created_at": updated.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}")
def delete_reading(id: int, db: Session = Depends(get_db)):
    reading = db.query(models.WaterReading).filter(models.WaterReading.id == id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Reading entry not found")
    db.delete(reading)
    db.commit()
    return {"message": "Reading deleted successfully."}


