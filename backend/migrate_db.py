import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models

def migrate():
    # Force recreate tables if needed
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Delete existing data to start fresh
        db.query(models.WaterReading).delete()
        db.query(models.Bill).delete()
        db.query(models.Flat).delete()
        db.query(models.Tower).delete()
        db.query(models.Community).delete()
        db.commit()

        # Create community
        community = models.Community(
            name="Greenfield Residency",
            type="Gated Community",
            address="Greenfield Road, Hyderabad, Telangana 500081",
            total_area="5.2 Acres",
            established_on="12 Jan 2021",
            manager_name="Rakesh Sharma",
            manager_phone="+91 98765 43210"
        )
        db.add(community)
        db.commit()
        db.refresh(community)

        # Create Tower A
        tower = models.Tower(
            name="Tower A",
            status="Active",
            floor_count=5,
            blocks_count=1,
            lifts_count=2,
            community_id=community.id
        )
        db.add(tower)
        db.commit()
        db.refresh(tower)

        # List of 25 flats
        flat_numbers = [
            "101", "102", "103", "104", "105",
            "201", "202", "203", "204", "205",
            "301", "302", "303", "304", "305",
            "401", "402", "403", "404", "405",
            "501", "502", "503", "504", "505"
        ]

        for num in flat_numbers:
            flat = models.Flat(
                number=num,
                status="Occupied", # Set to Occupied to display occupancy details in UI
                resident_name=f"Resident {num}",
                resident_phone=f"+91 99887 {num}00",
                occupants_count=0, # 0 occupants
                tower_id=tower.id
            )
            db.add(flat)
        db.commit()
        print("Successfully seeded 25 flats under Tower A in PostgreSQL.")
    except Exception as e:
        print("Migration failed:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    migrate()
