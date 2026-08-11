import sqlite3
import os

db_source_path = r"C:\Users\PC\Desktop\community bills\water_reading\Water Reading\backend\water_management.db"
db_dest_path = r"C:\Users\PC\Desktop\community bills\backend\community_bills.db"

if not os.path.exists(db_source_path):
    print("Source database not found!")
    exit(1)

if not os.path.exists(db_dest_path):
    print("Destination database not found!")
    exit(1)

conn_src = sqlite3.connect(db_source_path)
cursor_src = conn_src.cursor()

conn_dst = sqlite3.connect(db_dest_path)
cursor_dst = conn_dst.cursor()

# Get tower mapping from destination
cursor_dst.execute("SELECT id, name FROM towers;")
towers = cursor_dst.fetchall()
tower_map = {t[1]: t[0] for t in towers} # e.g. {"Tower A": 1, ...}

# 1. Fetch apartments from source
cursor_src.execute("SELECT id, apartment_number, owner_name, meter_id, status FROM apartments;")
src_apts = cursor_src.fetchall()

# Map source apartment_id to destination flat_id
apt_id_map = {}

print("Migrating apartments/flats...")
for apt in src_apts:
    src_id, apt_num, owner, meter, status = apt
    
    # Normalize apartment number (e.g. 101 -> A-101)
    if '-' in apt_num:
        flat_number = apt_num
        tower_letter = apt_num.split('-')[0]
        tower_name = f"Tower {tower_letter}"
    else:
        flat_number = f"A-{apt_num}"
        tower_name = "Tower A"
        
    # Get tower ID
    tower_id = tower_map.get(tower_name)
    if not tower_id:
        # If tower doesn't exist, create it or use Tower A
        tower_id = tower_map.get("Tower A", 1)
        
    # Find flat in destination database
    cursor_dst.execute("SELECT id FROM flats WHERE number = ?;", (flat_number,))
    dst_flat = cursor_dst.fetchone()
    
    if dst_flat:
        flat_id = dst_flat[0]
        apt_id_map[src_id] = flat_id
        
        # Update flat's meter_id and resident details if empty
        cursor_dst.execute("""
            UPDATE flats 
            SET meter_id = ?, resident_name = COALESCE(resident_name, ?), status = 'Occupied'
            WHERE id = ?;
        """, (meter, owner, flat_id))
    else:
        # Create missing flat
        cursor_dst.execute("""
            INSERT INTO flats (number, status, resident_name, occupants_count, tower_id, meter_id)
            VALUES (?, 'Occupied', ?, 2, ?, ?);
        """, (flat_number, owner, tower_id, meter))
        flat_id = cursor_dst.lastrowid
        apt_id_map[src_id] = flat_id
        print(f"Created missing flat {flat_number} under {tower_name} (ID: {flat_id})")

# Commit flat updates
conn_dst.commit()

# 2. Fetch and migrate water_readings
cursor_src.execute("SELECT apartment_id, month, previous_reading, current_reading, units, litres, water_cost, created_at FROM water_readings;")
src_readings = cursor_src.fetchall()

print(f"Migrating {len(src_readings)} water readings...")
inserted_count = 0
for rd in src_readings:
    src_apt_id, month, prev, curr, units, litres, cost, created = rd
    
    if src_apt_id in apt_id_map:
        dst_flat_id = apt_id_map[src_apt_id]
        
        # Check if reading already exists in destination
        cursor_dst.execute("SELECT id FROM water_readings WHERE apartment_id = ? AND month = ?;", (dst_flat_id, month))
        if cursor_dst.fetchone():
            continue
            
        cursor_dst.execute("""
            INSERT INTO water_readings (apartment_id, month, previous_reading, current_reading, units, litres, water_cost, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (dst_flat_id, month, prev, curr, units, litres, cost, created))
        inserted_count += 1

conn_dst.commit()
print(f"Successfully migrated {inserted_count} water readings into community_bills.db!")

conn_src.close()
conn_dst.close()
