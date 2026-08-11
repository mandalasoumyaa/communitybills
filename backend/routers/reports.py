from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import crud, models
import io
import csv
import datetime

router = APIRouter(prefix="/report", tags=["Reports"])

@router.get("/month")
def get_monthly_summary(month: str = "May 2026", db: Session = Depends(get_db)):
    """
    Returns calculated summary overview for a specific month.
    """
    rate_entry = db.query(models.WaterRate).filter(models.WaterRate.month == month).first()
    rate_per_litre = rate_entry.rate_per_litre if rate_entry else 0.575
    readings = db.query(models.WaterReading).filter(models.WaterReading.month == month).all()

    if not readings:
        return {
            "opening_reading_total": 0,
            "closing_reading_total": 0,
            "total_litres": 0,
            "total_units": 0,
            "actual_cost_per_litre": rate_per_litre,
            "average_consumption": 0,
            "highest_consumption": {"apartment": "--", "litres": 0},
            "lowest_consumption": {"apartment": "--", "litres": 0},
            "completion_percentage": 0
        }
        
    opening = sum(r.previous_reading for r in readings)
    closing = sum(r.current_reading if r.current_reading is not None else r.previous_reading for r in readings)
    total_litres = sum(r.litres for r in readings)
    total_units = sum(r.units for r in readings)
    
    completed_readings = [r for r in readings if r.current_reading is not None and r.current_reading >= r.previous_reading]
    billed_count = len(completed_readings)
    completion_percentage = int((billed_count / len(readings)) * 100) if readings else 0
    
    avg_consumption = total_litres / len(readings) if readings else 0
    
    # Highest & Lowest
    highest = {"apartment": "--", "litres": 0.0}
    lowest = {"apartment": "--", "litres": float("inf")}
    
    for r in completed_readings:
        if r.litres > highest["litres"]:
            highest = {"apartment": r.apartment.apartment_number, "litres": r.litres}
        if r.litres < lowest["litres"]:
            lowest = {"apartment": r.apartment.apartment_number, "litres": r.litres}
            
    if lowest["litres"] == float("inf"):
        lowest = {"apartment": "--", "litres": 0.0}
        
    return {
        "opening_reading_total": opening,
        "closing_reading_total": closing,
        "total_litres": total_litres,
        "total_units": total_units,
        "average_consumption": round(avg_consumption),
        "highest_consumption": highest,
        "lowest_consumption": lowest,
        "completion_percentage": completion_percentage,
        "actual_cost_per_litre": rate_per_litre
    }

@router.get("/year")
def get_yearly_summary(year: str = "2026", db: Session = Depends(get_db)):
    """
    Returns monthly summary logs for a specific year (History).
    """
    # Simple hardcoded mock historical summaries for 2026, merged with active DB values
    # In a full production app, this would query aggregated database values.
    history = [
        {"month": f"January {year}", "litres": 185400, "cost": 106605, "billed": "96/96"},
        {"month": f"February {year}", "litres": 190200, "cost": 109365, "billed": "96/96"},
        {"month": f"March {year}", "litres": 198100, "cost": 113908, "billed": "96/96"},
        {"month": f"April {year}", "litres": 194300, "cost": 111722, "billed": "96/96"},
    ]
    
    # Add active months from DB
    db_months = db.query(models.WaterReading.month).distinct().all()
    for m_tuple in db_months:
        month = m_tuple[0]
        if year in month and not any(h["month"] == month for h in history):
            readings = db.query(models.WaterReading).filter(models.WaterReading.month == month).all()
            total_litres = sum(r.litres for r in readings)
            total_cost = sum(r.water_cost for r in readings)
            billed_count = len([r for r in readings if r.current_reading is not None])
            history.append({
                "month": month,
                "litres": total_litres,
                "cost": total_cost,
                "billed": f"{billed_count}/{len(readings)}"
            })
            
    return history

@router.get("/export/csv")
def export_csv(month: str = "May 2026", db: Session = Depends(get_db)):
    """
    Generates a CSV report file of all readings for a month.
    """
    readings = db.query(models.WaterReading).filter(models.WaterReading.month == month).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Apartment", "Previous Reading", "Current Reading", 
        "Units", "Litres", "Cost (INR)", "Status"
    ])
    
    for r in readings:
        status = "Completed" if r.current_reading is not None else "Pending"
        writer.writerow([
            r.apartment.apartment_number,
            r.previous_reading,
            r.current_reading if r.current_reading is not None else "",
            r.units,
            r.litres,
            r.water_cost,
            status
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Water_Readings_{month.replace(' ', '_')}.csv"}
    )
