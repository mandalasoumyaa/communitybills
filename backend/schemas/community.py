from pydantic import BaseModel
from typing import List, Optional

# --- Flat Schemas ---
class FlatBase(BaseModel):
    number: str
    status: str = "Vacant"
    resident_name: Optional[str] = None
    resident_phone: Optional[str] = None
    occupants_count: int = 0
    tower_id: int
    occupancy_type: Optional[str] = "Owner"

class FlatCreate(FlatBase):
    pass

class FlatUpdate(BaseModel):
    number: Optional[str] = None
    status: Optional[str] = None
    resident_name: Optional[str] = None
    resident_phone: Optional[str] = None
    occupants_count: Optional[int] = None
    occupancy_type: Optional[str] = None

class Flat(FlatBase):
    id: int

    class Config:
        from_attributes = True


# --- Tower Schemas ---
class TowerBase(BaseModel):
    name: str
    status: str = "Active"
    floor_count: int = 10
    blocks_count: int = 1
    lifts_count: int = 2
    community_id: int

class TowerCreate(TowerBase):
    flats_per_floor: Optional[int] = 4

class TowerUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    floor_count: Optional[int] = None
    blocks_count: Optional[int] = None
    lifts_count: Optional[int] = None

class Tower(TowerBase):
    id: int
    flats: List[Flat] = []

    class Config:
        from_attributes = True


# --- Community Schemas ---
class CommunityBase(BaseModel):
    name: str
    type: str = "Gated Community"
    address: str
    total_area: str
    established_on: str
    manager_name: str
    manager_phone: str

class CommunityCreate(CommunityBase):
    pass

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    total_area: Optional[str] = None
    established_on: Optional[str] = None
    manager_name: Optional[str] = None
    manager_phone: Optional[str] = None

class Community(CommunityBase):
    id: int
    towers: List[Tower] = []

    class Config:
        from_attributes = True

# --- Dashboard & Aggregated Schemas ---
class TowerOverview(BaseModel):
    id: int
    name: str
    status: str
    floor_count: int
    blocks_count: int
    lifts_count: int
    total_flats: int
    occupied_flats: int
    vacant_flats: int
    total_residents: int

class CommunityOverview(BaseModel):
    id: int
    name: str
    type: str
    address: str
    total_area: str
    established_on: str
    manager_name: str
    manager_phone: str
    total_towers: int
    total_flats: int
    total_residents: int
    occupied_flats: int
    vacant_flats: int
    occupancy_rate: float
