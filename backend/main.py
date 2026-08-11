from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import engine, get_db
from routers import expense, water, bills, upload, reports

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Community Management System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expense.router)
app.include_router(water.router)
app.include_router(bills.router)
app.include_router(upload.router)
app.include_router(reports.router)

# Seed database on startup
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    crud.seed_data(db)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Community Management System API"}

# --- Community Endpoints ---
@app.get("/communities", response_model=List[schemas.Community])
def read_communities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_communities(db, skip=skip, limit=limit)

@app.post("/communities", response_model=schemas.Community)
def create_community(community: schemas.CommunityCreate, db: Session = Depends(get_db)):
    return crud.create_community(db=db, community=community)

@app.get("/communities/{community_id}", response_model=schemas.Community)
def read_community(community_id: int, db: Session = Depends(get_db)):
    db_community = crud.get_community(db, community_id=community_id)
    if db_community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    return db_community

@app.get("/communities/{community_id}/overview", response_model=schemas.CommunityOverview)
def read_community_overview(community_id: int, db: Session = Depends(get_db)):
    overview = crud.get_community_overview(db, community_id=community_id)
    if overview is None:
        raise HTTPException(status_code=404, detail="Community not found")
    return overview

@app.put("/communities/{community_id}", response_model=schemas.Community)
def update_community(community_id: int, community: schemas.CommunityUpdate, db: Session = Depends(get_db)):
    db_community = crud.update_community(db, community_id=community_id, community=community)
    if db_community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    return db_community

@app.delete("/communities/{community_id}")
def delete_community(community_id: int, db: Session = Depends(get_db)):
    success = crud.delete_community(db=db, community_id=community_id)
    if not success:
        raise HTTPException(status_code=404, detail="Community not found")
    return {"message": "Community deleted successfully"}

# --- Tower Endpoints ---
@app.get("/communities/{community_id}/towers", response_model=List[schemas.Tower])
def read_community_towers(community_id: int, db: Session = Depends(get_db)):
    return crud.get_towers_by_community(db, community_id=community_id)

@app.get("/communities/{community_id}/towers/overview", response_model=List[schemas.TowerOverview])
def read_community_towers_overview(community_id: int, db: Session = Depends(get_db)):
    return crud.get_towers_overview(db, community_id=community_id)

@app.post("/towers", response_model=schemas.Tower)
def create_tower(tower: schemas.TowerCreate, db: Session = Depends(get_db)):
    return crud.create_tower(db=db, tower=tower)

@app.put("/towers/{tower_id}", response_model=schemas.Tower)
def update_tower(tower_id: int, tower: schemas.TowerUpdate, db: Session = Depends(get_db)):
    db_tower = crud.update_tower(db=db, tower_id=tower_id, tower=tower)
    if db_tower is None:
        raise HTTPException(status_code=404, detail="Tower not found")
    return db_tower

@app.delete("/towers/{tower_id}")
def delete_tower(tower_id: int, db: Session = Depends(get_db)):
    success = crud.delete_tower(db=db, tower_id=tower_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tower not found")
    return {"message": "Tower deleted successfully"}

# --- Flat Endpoints ---
@app.get("/towers/{tower_id}/flats", response_model=List[schemas.Flat])
def read_tower_flats(tower_id: int, db: Session = Depends(get_db)):
    return crud.get_flats_by_tower(db, tower_id=tower_id)

@app.post("/flats", response_model=schemas.Flat)
def create_flat(flat: schemas.FlatCreate, db: Session = Depends(get_db)):
    return crud.create_flat(db=db, flat=flat)

@app.put("/flats/{flat_id}", response_model=schemas.Flat)
def update_flat(flat_id: int, flat: schemas.FlatUpdate, db: Session = Depends(get_db)):
    db_flat = crud.update_flat(db=db, flat_id=flat_id, flat=flat)
    if db_flat is None:
        raise HTTPException(status_code=404, detail="Flat not found")
    return db_flat

@app.delete("/flats/{flat_id}")
def delete_flat(flat_id: int, db: Session = Depends(get_db)):
    success = crud.delete_flat(db=db, flat_id=flat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Flat not found")
    return {"message": "Flat deleted successfully"}
