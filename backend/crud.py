from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
import datetime
from typing import Optional, List
from services import calculation
import models, schemas

# --- Community CRUD ---
def get_community(db: Session, community_id: int):
    return db.query(models.Community).filter(models.Community.id == community_id).first()

def get_communities(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Community).offset(skip).limit(limit).all()

def create_community(db: Session, community: schemas.CommunityCreate):
    db_community = models.Community(**community.dict())
    db.add(db_community)
    db.commit()
    db.refresh(db_community)
    return db_community

def update_community(db: Session, community_id: int, community: schemas.CommunityUpdate):
    db_community = get_community(db, community_id)
    if not db_community:
        return None
    for key, value in community.dict(exclude_unset=True).items():
        setattr(db_community, key, value)
    db.commit()
    db.refresh(db_community)
    return db_community

def delete_community(db: Session, community_id: int):
    db_community = get_community(db, community_id)
    if db_community:
        db.delete(db_community)
        db.commit()
        return True
    return False

# --- Tower CRUD ---
def get_tower(db: Session, tower_id: int):
    return db.query(models.Tower).filter(models.Tower.id == tower_id).first()

def get_towers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Tower).offset(skip).limit(limit).all()

def get_towers_by_community(db: Session, community_id: int):
    return db.query(models.Tower).filter(models.Tower.community_id == community_id).all()

def create_tower(db: Session, tower: schemas.TowerCreate):
    tower_data = tower.dict()
    flats_per_floor = tower_data.pop("flats_per_floor", 4)
    db_tower = models.Tower(**tower_data)
    db.add(db_tower)
    db.commit()
    db.refresh(db_tower)
    
    # Automatically generate flats per floor for the new tower
    tower_suffix = db_tower.name.split()[-1] if db_tower.name else "A"
    
    for floor in range(1, db_tower.floor_count + 1):
        for unit in range(1, (flats_per_floor or 4) + 1):
            f_num = f"{tower_suffix}-{floor}0{unit}"
            flat = models.Flat(
                number=f_num,
                status="Vacant",
                resident_name=None,
                resident_phone=None,
                occupants_count=0,
                tower_id=db_tower.id
            )
            db.add(flat)
    db.commit()
    db.refresh(db_tower)
    return db_tower

def update_tower(db: Session, tower_id: int, tower: schemas.TowerUpdate):
    db_tower = get_tower(db, tower_id)
    if not db_tower:
        return None
    for key, value in tower.dict(exclude_unset=True).items():
        setattr(db_tower, key, value)
    db.commit()
    db.refresh(db_tower)
    return db_tower

def delete_tower(db: Session, tower_id: int):
    db_tower = get_tower(db, tower_id)
    if db_tower:
        db.delete(db_tower)
        db.commit()
        return True
    return False

# --- Flat CRUD ---
def get_flat(db: Session, flat_id: int):
    return db.query(models.Flat).filter(models.Flat.id == flat_id).first()

def get_flats(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Flat).offset(skip).limit(limit).all()

def get_flats_by_tower(db: Session, tower_id: int):
    flats = db.query(models.Flat).filter(models.Flat.tower_id == tower_id).all()
    import re
    def natural_sort_key(flat):
        parts = re.split(r'(\d+)', flat.number)
        return [int(text) if text.isdigit() else text.lower() for text in parts]
    flats.sort(key=natural_sort_key)
    return flats

def create_flat(db: Session, flat: schemas.FlatCreate):
    db_flat = models.Flat(**flat.dict())
    db.add(db_flat)
    db.commit()
    db.refresh(db_flat)
    return db_flat

def update_flat(db: Session, flat_id: int, flat: schemas.FlatUpdate):
    db_flat = get_flat(db, flat_id)
    if not db_flat:
        return None
    for key, value in flat.dict(exclude_unset=True).items():
        setattr(db_flat, key, value)
    db.commit()
    db.refresh(db_flat)
    return db_flat

def delete_flat(db: Session, flat_id: int):
    db_flat = get_flat(db, flat_id)
    if db_flat:
        db.delete(db_flat)
        db.commit()
        return True
    return False

# --- Aggregates and Overview ---
def get_community_overview(db: Session, community_id: int) -> schemas.CommunityOverview:
    community = get_community(db, community_id)
    if not community:
        return None
    
    total_towers = len(community.towers)
    total_flats = 0
    total_residents = 0
    occupied_flats = 0
    vacant_flats = 0
    
    for tower in community.towers:
        total_flats += len(tower.flats)
        for flat in tower.flats:
            if flat.status == "Occupied":
                occupied_flats += 1
                total_residents += flat.occupants_count
            else:
                vacant_flats += 1
                
    occupancy_rate = (occupied_flats / total_flats * 100) if total_flats > 0 else 0.0
    
    return schemas.CommunityOverview(
        id=community.id,
        name=community.name,
        type=community.type,
        address=community.address,
        total_area=community.total_area,
        established_on=community.established_on,
        manager_name=community.manager_name,
        manager_phone=community.manager_phone,
        total_towers=total_towers,
        total_flats=total_flats,
        total_residents=total_residents,
        occupied_flats=occupied_flats,
        vacant_flats=vacant_flats,
        occupancy_rate=round(occupancy_rate, 2)
    )

def get_towers_overview(db: Session, community_id: int):
    towers = get_towers_by_community(db, community_id)
    overview_list = []
    
    for tower in towers:
        total_flats = len(tower.flats)
        occupied_flats = 0
        vacant_flats = 0
        total_residents = 0
        for flat in tower.flats:
            if flat.status == "Occupied":
                occupied_flats += 1
                total_residents += flat.occupants_count
            else:
                vacant_flats += 1
        
        overview_list.append(schemas.TowerOverview(
            id=tower.id,
            name=tower.name,
            status=tower.status,
            floor_count=tower.floor_count,
            blocks_count=tower.blocks_count,
            lifts_count=tower.lifts_count,
            total_flats=total_flats,
            occupied_flats=occupied_flats,
            vacant_flats=vacant_flats,
            total_residents=total_residents
        ))
    return overview_list

# --- Seeding ---
def seed_data(db: Session):
    # Check if community already exists
    if db.query(models.Community).first():
        return
    
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
    
    # Towers configuration
    # Tower A: 32 flats, 30 occupied, 2 vacant, 56 residents
    # Tower B: 32 flats, 29 occupied, 3 vacant, 54 residents
    # Tower C: 32 flats, 30 occupied, 2 vacant, 60 residents
    # Tower D: 32 flats, 29 occupied, 3 vacant, 55 residents
    towers_config = [
        {"name": "Tower A", "floor_count": 10, "blocks_count": 1, "lifts_count": 2, "occupied": 30, "vacant": 2, "residents_target": 56},
        {"name": "Tower B", "floor_count": 10, "blocks_count": 1, "lifts_count": 2, "occupied": 29, "vacant": 3, "residents_target": 54},
        {"name": "Tower C", "floor_count": 10, "blocks_count": 1, "lifts_count": 2, "occupied": 30, "vacant": 2, "residents_target": 60},
        {"name": "Tower D", "floor_count": 10, "blocks_count": 1, "lifts_count": 2, "occupied": 29, "vacant": 3, "residents_target": 55},
    ]
    
    names_pool = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Ishaan", "Krishna", "Pranav", "Aryan", "Kabir",
                  "Ananya", "Diya", "Sanya", "Pooja", "Neha", "Riya", "Kavya", "Sneha", "Aditi", "Meera",
                  "Rahul", "Amit", "Sanjay", "Vikram", "Anil", "Sunil", "Rajesh", "Karan", "Abhishek", "Deepak"]
    
    for t_conf in towers_config:
        tower = models.Tower(
            name=t_conf["name"],
            status="Active",
            floor_count=t_conf["floor_count"],
            blocks_count=t_conf["blocks_count"],
            lifts_count=t_conf["lifts_count"],
            community_id=community.id
        )
        db.add(tower)
        db.commit()
        db.refresh(tower)
        
        # We need to generate flats for this tower. E.g., 8 floors, 5 flats per floor.
        flat_number = 1
        occupied_count = 0
        total_residents_added = 0
        
        for floor in range(1, 9): # 8 floors
            for unit in range(1, 6): # 5 flats per floor
                f_num = f"{tower.name.split()[-1]}-{floor}0{unit}"
                
                # Determine status
                if occupied_count < t_conf["occupied"]:
                    status = "Occupied"
                    occupied_count += 1
                    
                    # Distribute residents to match the target
                    remaining_occupied = t_conf["occupied"] - occupied_count + 1
                    remaining_residents = t_conf["residents_target"] - total_residents_added
                    
                    # Calculate occupants count for this flat
                    if remaining_occupied == 1:
                        occupants = remaining_residents
                    else:
                        import random
                        # Keep it between 1 and 4, target average depends on target residents
                        avg_needed = remaining_residents / remaining_occupied
                        if avg_needed > 2.5:
                            occupants = random.choice([2, 3, 4])
                        else:
                            occupants = random.choice([1, 2, 3])
                    
                    total_residents_added += occupants
                    res_name = f"{names_pool[(floor * unit) % len(names_pool)]} Kumar"
                    res_phone = f"+91 99887 {random.randint(10000, 99999)}"
                else:
                    status = "Vacant"
                    occupants = 0
                    res_name = None
                    res_phone = None
                
                flat = models.Flat(
                    number=f_num,
                    status=status,
                    resident_name=res_name,
                    resident_phone=res_phone,
                    occupants_count=occupants,
                    tower_id=tower.id
                )
                db.add(flat)
        db.commit()


# --- Extracted Water Reading CRUD operations ---

def get_apartment_by_number(db: Session, apartment_number: str):
    flat = db.query(models.Apartment).filter(
        models.Apartment.apartment_number == apartment_number.upper(),
        models.Apartment.tower_id == 1
    ).first()
    if flat:
        return flat
    return db.query(models.Apartment).filter(models.Apartment.apartment_number == apartment_number.upper()).first()

def get_or_create_apartment(db: Session, apartment_number: str, owner_name: str = None, meter_id: str = None):
    db_apt = get_apartment_by_number(db, apartment_number)
    if not db_apt:
        db_apt = models.Apartment(
            apartment_number=apartment_number.upper(),
            owner_name=owner_name or f"Owner {apartment_number}",
            meter_id=meter_id or f"MTR-{apartment_number}",
            status="Active"
        )
        db.add(db_apt)
        db.commit()
        db.refresh(db_apt)
    return db_apt

def get_water_reading_by_apt_month(db: Session, apartment_id: int, month: str):
    return db.query(models.WaterReading).filter(
        and_(models.WaterReading.apartment_id == apartment_id, models.WaterReading.month == month)
    ).first()

def get_water_readings(
    db: Session,
    month: str,
    search: str = "",
    floor: str = "All",
    status: str = "All",
    skip: int = 0,
    limit: int = 100,
    sort_col: str = "apartment_number",
    sort_dir: str = "asc"
):
    # Ensure all required flats exist in water_readings for the given month
    required_flat_numbers = [
        "101", "102", "103", "104", "105",
        "201", "202", "203", "204", "205",
        "301", "302", "303", "304", "305",
        "401", "402", "403", "404", "405",
        "501", "502", "503", "504", "505"
    ]
    
    # Ensure flats exist in the database under Tower 1
    for flat_num in required_flat_numbers:
        flat_exists = db.query(models.Flat).filter(models.Flat.number == flat_num).first()
        if not flat_exists:
            new_flat = models.Flat(
                number=flat_num,
                status="Occupied",
                resident_name=f"Resident {flat_num}",
                tower_id=1
            )
            db.add(new_flat)
    db.commit()
    
    flats_to_generate = db.query(models.Flat).filter(
        models.Flat.number.in_(required_flat_numbers),
        models.Flat.tower_id == 1
    ).all()
    
    if not flats_to_generate:
        flats_to_generate = db.query(models.Flat).filter(
            models.Flat.number.in_(required_flat_numbers)
        ).all()
        seen_numbers = set()
        unique_flats = []
        for f in flats_to_generate:
            if f.number not in seen_numbers:
                seen_numbers.add(f.number)
                unique_flats.append(f)
        flats_to_generate = unique_flats

    def parse_month_to_tuple(m_str):
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        try:
            parts = m_str.split()
            if len(parts) == 2:
                return int(parts[1]), months.index(parts[0])
        except:
            pass
        return (0, 0)

    target_month_tuple = parse_month_to_tuple(month)

    existing_readings = db.query(models.WaterReading).filter(
        models.WaterReading.month == month
    ).all()
    existing_flat_ids = {r.apartment_id for r in existing_readings}

    has_new = False
    for flat in flats_to_generate:
        if flat.id not in existing_flat_ids:
            all_readings = db.query(models.WaterReading).filter(
                models.WaterReading.apartment_id == flat.id
            ).all()
            
            prev_val = 0.0
            past_readings = []
            for r in all_readings:
                r_tuple = parse_month_to_tuple(r.month)
                if r_tuple < target_month_tuple:
                    past_readings.append((r_tuple, r))
            
            if past_readings:
                past_readings.sort(key=lambda x: x[0], reverse=True)
                closest_reading = past_readings[0][1]
                prev_val = closest_reading.current_reading if closest_reading.current_reading is not None else 0.0
            else:
                prev_val = 0.0
                
            new_r = models.WaterReading(
                apartment_id=flat.id,
                month=month,
                previous_reading=prev_val,
                current_reading=None,
                units=0.0,
                litres=0.0,
                water_cost=0.0
            )
            db.add(new_r)
            has_new = True
            
    if has_new:
        db.commit()

    query = db.query(models.WaterReading).join(models.Flat, models.WaterReading.apartment_id == models.Flat.id).filter(
        models.WaterReading.month == month,
        models.Flat.number.in_(required_flat_numbers),
        models.Flat.tower_id == 1
    )

    # Search filter
    if search:
        query = query.filter(models.Flat.number.ilike(f"%{search}%"))

    # Floor filter (e.g. A-101 has floor 1, B-1205 has floor 12)
    if floor != "All":
        floor_num = int(floor)
        if floor_num >= 10:
            pattern = f"%-{floor_num}__"
        else:
            pattern = f"%-{floor_num}__"
        query = query.filter(models.Flat.number.like(pattern))

    # Fetch all matching first to apply status filtering correctly
    results = query.all()

    # Calculate status and filter
    filtered_results = []
    for r in results:
        # Compute status
        if r.current_reading is None:
            r_status = "Pending"
        elif r.current_reading < r.previous_reading:
            r_status = "Missing"
        else:
            r_status = "Completed"
        
        if status == "All" or r_status == status:
            r.status = r_status # attach transient attribute
            filtered_results.append(r)

    # Apply sorting in Python to handle joined/computed columns easily
    reverse = (sort_dir == "desc")
    if sort_col == "apartment_number":
        filtered_results.sort(key=lambda x: x.apartment.apartment_number, reverse=reverse)
    elif sort_col == "previous_reading":
        filtered_results.sort(key=lambda x: x.previous_reading, reverse=reverse)
    elif sort_col == "current_reading":
        filtered_results.sort(key=lambda x: x.current_reading or 0.0, reverse=reverse)
    elif sort_col == "consumption_litres":
        filtered_results.sort(key=lambda x: x.litres, reverse=reverse)
    elif sort_col == "cost":
        filtered_results.sort(key=lambda x: x.water_cost, reverse=reverse)

    total_count = len(filtered_results)
    # Apply pagination
    paginated = filtered_results[skip : skip + limit]

    return paginated, total_count

def propagate_reading_forward(db: Session, apartment_id: int, month: str, current_reading: float):
    def get_next_month_str(m_str: str) -> str:
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        try:
            parts = m_str.split()
            if len(parts) == 2:
                m_name, y_str = parts
                year = int(y_str)
                m_idx = months.index(m_name)
                next_m_idx = (m_idx + 1) % 12
                next_year = year + (1 if next_m_idx == 0 else 0)
                return f"{months[next_m_idx]} {next_year}"
        except:
            pass
        return None

    next_month = get_next_month_str(month)
    if next_month:
        next_reading = get_water_reading_by_apt_month(db, apartment_id, next_month)
        if next_reading:
            next_reading.previous_reading = current_reading
            if next_reading.current_reading is not None:
                if next_reading.current_reading < current_reading:
                    next_reading.current_reading = current_reading
                    next_reading.units = 0.0
                    next_reading.litres = 0.0
                    next_reading.water_cost = 0.0
                else:
                    next_reading.units = calculation.calculate_consumption_units(next_reading.current_reading, current_reading)
                    next_reading.litres = calculation.calculate_litres(next_reading.units)
                    
                    next_rate = 0.575
                    next_rate_entry = db.query(models.WaterRate).filter(models.WaterRate.month == next_month).first()
                    if next_rate_entry:
                        next_rate = next_rate_entry.rate_per_litre
                    next_reading.water_cost = calculation.calculate_water_cost(next_reading.litres, next_rate)
                
                db.commit()
                
                # Update corresponding Bill if exists
                bill_record = db.query(models.Bill).filter(models.Bill.apartment_id == apartment_id).first()
                if bill_record:
                    bill_record.water_cost = next_reading.water_cost
                    bill_record.total = next_reading.water_cost + bill_record.maintenance
                    db.commit()
            else:
                db.commit()

def create_or_update_reading(
    db: Session, 
    apartment_id: int, 
    month: str, 
    previous_reading: float,
    current_reading: Optional[float] = None,
    rate_per_litre: float = 0.575,
    commit: bool = True,
    propagate_forward: bool = True
):
    rate_entry = db.query(models.WaterRate).filter(models.WaterRate.month == month).first()
    if rate_entry:
        rate_per_litre = rate_entry.rate_per_litre

    db_reading = get_water_reading_by_apt_month(db, apartment_id, month)
    
    units = 0.0
    litres = 0.0
    cost = 0.0
    
    if current_reading is not None:
        if current_reading < previous_reading:
            raise ValueError(f"Current reading ({current_reading}) cannot be less than previous ({previous_reading}).")
        units = calculation.calculate_consumption_units(current_reading, previous_reading)
        litres = calculation.calculate_litres(units)
        cost = calculation.calculate_water_cost(litres, rate_per_litre)

    if db_reading:
        db_reading.previous_reading = previous_reading
        db_reading.current_reading = current_reading
        db_reading.units = units
        db_reading.litres = litres
        db_reading.water_cost = cost
    else:
        db_reading = models.WaterReading(
            apartment_id=apartment_id,
            month=month,
            previous_reading=previous_reading,
            current_reading=current_reading,
            units=units,
            litres=litres,
            water_cost=cost
        )
        db.add(db_reading)
    
    if commit:
        db.commit()
        db.refresh(db_reading)

        # Automatically propagate current reading to next month previous reading if next month record exists
        if current_reading is not None and propagate_forward:
            propagate_reading_forward(db, apartment_id, month, current_reading)
    else:
        db.flush()

    return db_reading

def generate_bills(db: Session, month: str, rate_per_litre: float = 0.575, maintenance: float = 250.0):
    # Fetch all completed readings for the month
    readings = db.query(models.WaterReading).filter(
        and_(models.WaterReading.month == month, models.WaterReading.current_reading != None)
    ).all()

    generated_bills = []
    due_date = datetime.date.today() + datetime.timedelta(days=15)

    for r in readings:
        if r.current_reading < r.previous_reading:
            continue
        
        # Check if bill exists
        db_bill = db.query(models.Bill).filter(
            and_(models.Bill.apartment_id == r.apartment_id, models.Bill.due_date >= datetime.date.today())
        ).first()

        total = r.water_cost + maintenance
        if db_bill:
            db_bill.water_cost = r.water_cost
            db_bill.maintenance = maintenance
            db_bill.total = total
        else:
            db_bill = models.Bill(
                apartment_id=r.apartment_id,
                water_cost=r.water_cost,
                maintenance=maintenance,
                total=total,
                paid=False,
                due_date=due_date
            )
            db.add(db_bill)
        
        generated_bills.append(db_bill)
    
    db.commit()
    return len(generated_bills)

def get_bills(db: Session):
    return db.query(models.Bill).all()

def get_bill_by_id(db: Session, bill_id: int):
    return db.query(models.Bill).filter(models.Bill.id == bill_id).first()
