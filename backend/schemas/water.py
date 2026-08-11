from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime

# --- Extracted Water Reading Schemas ---

class ApartmentBase(BaseModel):
    apartment_number: str
    owner_name: Optional[str] = None
    meter_id: Optional[str] = None
    status: str = "Active"

class ApartmentCreate(ApartmentBase):
    pass

class ApartmentResponse(ApartmentBase):
    id: int

    class Config:
        from_attributes = True

class WaterReadingBase(BaseModel):
    apartment_id: int
    month: str
    previous_reading: float = Field(..., ge=0)
    current_reading: Optional[float] = None

class WaterReadingCreate(WaterReadingBase):
    @field_validator('previous_reading')
    @classmethod
    def check_non_negative(cls, v):
        if v < 0:
            raise ValueError('Reading values must be non-negative')
        return v

class WaterReadingUpdate(BaseModel):
    current_reading: Optional[float] = None
    water_cost: Optional[float] = None

    @field_validator('current_reading')
    @classmethod
    def check_current_reading_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Current reading must be non-negative')
        return v

class WaterReadingResponse(BaseModel):
    id: int
    apartment_id: int
    apartment_number: str
    month: str
    previous_reading: float
    current_reading: Optional[float]
    units: float
    litres: float
    water_cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WaterExpenseBase(BaseModel):
    supplier: str
    tankers: int = Field(0, ge=0)
    litres: float = Field(0.0, ge=0)
    amount: float = Field(0.0, ge=0)
    gst: float = Field(0.0, ge=0)
    date: date

class WaterExpenseCreate(WaterExpenseBase):
    pass

class WaterExpenseResponse(WaterExpenseBase):
    id: int

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    apartment_id: int
    water_cost: float = Field(0.0, ge=0)
    maintenance: float = Field(0.0, ge=0)
    total: float = Field(0.0, ge=0)
    paid: bool = False
    due_date: date

class BillCreate(BillBase):
    pass

class BillResponse(BaseModel):
    id: int
    apartment_id: int
    apartment_number: str
    water_cost: float
    maintenance: float
    total: float
    paid: bool
    due_date: date

    class Config:
        from_attributes = True

class OCRResponse(BaseModel):
    apartment_number: str
    current_reading: float
    confidence: float
