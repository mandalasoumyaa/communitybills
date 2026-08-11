from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime, Date, UniqueConstraint
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func
from database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String, default="Gated Community")
    address = Column(String)
    total_area = Column(String)
    established_on = Column(String)
    manager_name = Column(String)
    manager_phone = Column(String)

    towers = relationship("Tower", back_populates="community", cascade="all, delete-orphan")


class Tower(Base):
    __tablename__ = "towers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="Active")
    floor_count = Column(Integer, default=10)
    blocks_count = Column(Integer, default=1)
    lifts_count = Column(Integer, default=2)
    
    community_id = Column(Integer, ForeignKey("communities.id"))
    community = relationship("Community", back_populates="towers")
    
    flats = relationship("Flat", back_populates="tower", cascade="all, delete-orphan")


class Flat(Base):
    __tablename__ = "flats"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, index=True)
    status = Column(String, default="Vacant")  # "Occupied" or "Vacant"
    resident_name = Column(String, nullable=True)
    resident_phone = Column(String, nullable=True)
    occupants_count = Column(Integer, default=0)
    meter_id = Column(String, nullable=True)
    occupancy_type = Column(String, default="Owner")
    
    tower_id = Column(Integer, ForeignKey("towers.id"))
    tower = relationship("Tower", back_populates="flats")

    apartment_number = synonym("number")
    owner_name = synonym("resident_name")

    readings = relationship("WaterReading", back_populates="apartment", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="apartment", cascade="all, delete-orphan")


class WaterReading(Base):
    __tablename__ = "water_readings"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("flats.id", ondelete="CASCADE"), nullable=False)
    month = Column(String, index=True, nullable=False) # e.g. "May 2026"
    previous_reading = Column(Float, nullable=False, default=0.0)
    current_reading = Column(Float, nullable=True)
    units = Column(Float, nullable=False, default=0.0)
    litres = Column(Float, nullable=False, default=0.0)
    water_cost = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    apartment = relationship("Flat", back_populates="readings")

    # Enforce uniqueness constraint for flat and month
    __table_args__ = (
        UniqueConstraint("apartment_id", "month", name="uq_apartment_month"),
    )


class WaterExpense(Base):
    __tablename__ = "water_expenses"

    id = Column(Integer, primary_key=True, index=True)
    supplier = Column(String, nullable=False)
    tankers = Column(Integer, default=0)
    litres = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    gst = Column(Float, default=0.0)
    date = Column(Date, nullable=False)


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("flats.id", ondelete="CASCADE"), nullable=False)
    water_cost = Column(Float, default=0.0)
    maintenance = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    paid = Column(Boolean, default=False)
    due_date = Column(Date, nullable=False)

    apartment = relationship("Flat", back_populates="bills")


class WaterRate(Base):
    __tablename__ = "water_rates"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, unique=True, index=True, nullable=False)
    rate_per_litre = Column(Float, nullable=False, default=0.575)


Apartment = Flat
