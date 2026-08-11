import sqlite3
from database import engine
import models

db_path = "community_bills.db"

# Drop old tables to regenerate with correct schema
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("DROP TABLE IF EXISTS water_readings;")
    cursor.execute("DROP TABLE IF EXISTS bills;")
    cursor.execute("DROP TABLE IF EXISTS water_expenses;")
    print("Dropped tables.")
except Exception as e:
    print("Error dropping tables:", e)
conn.commit()
conn.close()

# Recreate all tables
models.Base.metadata.create_all(bind=engine)
print("Created tables successfully using SQLAlchemy metadata.")
