from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from database import get_db
from services import ocr
from pydantic import BaseModel
from typing import Optional
import crud, models
import csv
import io
import shutil
import os

router = APIRouter(prefix="/upload", tags=["Upload & Import"])

# Temporary directory for OCR uploads
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

def get_previous_reading_for_apt(db: Session, apartment_number: str, month: str) -> float:
    # 1. Check if there is an existing reading record for this month
    apt = crud.get_apartment_by_number(db, apartment_number)
    if not apt:
        return 0.0
    
    existing = db.query(models.WaterReading).filter(
        models.WaterReading.apartment_id == apt.id,
        models.WaterReading.month == month
    ).first()
    
    if existing:
        return existing.previous_reading
        
    # 2. If not found, look up the latest completed reading for this apartment
    latest = db.query(models.WaterReading).filter(
        models.WaterReading.apartment_id == apt.id,
        models.WaterReading.current_reading != None
    ).order_by(models.WaterReading.id.desc()).first()
    return latest.current_reading if latest else 0.0

def normalize_apartment_number(apt_str: str) -> str:
    import re
    if not apt_str:
        return ""
    clean = apt_str.strip().upper().replace(" ", "").replace("_", "").replace("-", "")
    if not clean:
        return ""
    if clean.isdigit():
        return clean
    match = re.match(r'^([A-L])(\d+)$', clean)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    return apt_str.strip().upper()

@router.post("/image")
def upload_image_ocr(file: UploadFile = File(...)):
    """
    Upload a water meter image. Runs OCR to extract apartment number, reading, and confidence.
    """
    file_path = os.path.join(TEMP_DIR, file.filename)
    try:
        # Save file locally for OCR processing
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = ocr.perform_ocr(file_path, file.filename)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )
    finally:
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/csv")
def upload_csv_readings(
    file: UploadFile = File(...),
    month: str = "May 2026",
    rate_per_litre: float = 0.575,
    db: Session = Depends(get_db)
):
    """
    Upload and parse a CSV file of water readings.
    Validates data line-by-line: checks for negative values, ensuring current >= previous.
    Saves successfully processed rows.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )
        
    try:
        file.file.seek(0)
        contents = file.file.read().decode("utf-8-sig")
        # Auto-detect delimiter: comma or semicolon
        delimiter = ','
        if ';' in contents and contents.count(';') > contents.count(','):
            delimiter = ';'
            
        # Find first line that has headers
        lines = contents.splitlines()
        header_idx = 0
        for i, line in enumerate(lines[:10]):
            cols = [c.strip().lower().replace(" ", "").replace("_", "").replace("-", "").replace(".", "") for c in line.split(delimiter)]
            has_apt = any(any(x in col for x in ["apartment", "apt", "flat", "unit", "room", "house", "door"]) for col in cols)
            has_read = any(any(x in col for x in ["reading", "current", "curr", "closing", "end", "val"]) for col in cols)
            if has_apt and has_read:
                header_idx = i
                break
        
        contents_clean = "\n".join(lines[header_idx:])
        csv_reader = csv.DictReader(io.StringIO(contents_clean), delimiter=delimiter)
        
        processed_count = 0
        error_rows = []
        
        for idx, row in enumerate(csv_reader):
            # Normalise keys, filter out None keys
            normalized_row = {k.strip().lower().replace(" ", "_"): v for k, v in row.items() if k is not None}
            
            # Fuzzy match keys
            apt_num = None
            prev_str = None
            curr_str = None
            
            for k, v in normalized_row.items():
                if not k:
                    continue
                k_clean = k.strip().lower().replace(" ", "").replace("_", "").replace("-", "").replace(".", "")
                
                # Check for apartment keys
                if any(x in k_clean for x in ["apartment", "apt", "flat", "unit", "room", "house", "door"]):
                    apt_num = v
                # Check for previous keys
                elif any(x in k_clean for x in ["previous", "prev", "opening", "start"]):
                    prev_str = v
                # Check for current keys (excluding previous keywords)
                elif any(x in k_clean for x in ["current", "curr", "closing", "end"]) or ("reading" in k_clean and "prev" not in k_clean and "previous" not in k_clean):
                    curr_str = v

            if apt_num is None or curr_str is None:
                error_rows.append(f"Row {idx+1}: Missing required columns (Apartment, Current)")
                continue
                
            try:
                apt_num_str = normalize_apartment_number(str(apt_num))
                apt = crud.get_apartment_by_number(db, apartment_number=apt_num_str)
                if not apt:
                    error_rows.append(f"Row {idx+1} ({apt_num}): Flat number does not exist in database")
                    continue
                
                if prev_str is not None:
                    prev = float(prev_str)
                else:
                    prev = get_previous_reading_for_apt(db, apt_num_str, month)
                    
                curr = float(curr_str)
                
                if prev < 0 or curr < 0:
                    error_rows.append(f"Row {idx+1} ({apt_num}): Readings cannot be negative")
                    continue
                if curr < prev:
                    error_rows.append(f"Row {idx+1} ({apt_num}): Current reading ({curr}) cannot be less than previous ({prev})")
                    continue
                    
                # Write to DB
                crud.create_or_update_reading(
                    db,
                    apartment_id=apt.id,
                    month=month,
                    previous_reading=prev,
                    current_reading=curr,
                    rate_per_litre=rate_per_litre
                )
                processed_count += 1
            except ValueError:
                error_rows.append(f"Row {idx+1} ({apt_num}): Invalid number values")
                
        if error_rows and processed_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "All rows failed verification.", "errors": error_rows}
            )
            
        return {
            "message": f"Successfully imported {processed_count} readings.",
            "failed_rows": len(error_rows),
            "errors": error_rows
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process CSV file: {str(e)}"
        )

@router.post("/excel")
def upload_excel_readings(
    file: UploadFile = File(...),
    month: str = "May 2026",
    rate_per_litre: float = 0.575,
    db: Session = Depends(get_db)
):
    """
    Upload and process an Excel file (.xlsx or .xls) of water readings.
    Validates rows, calculates consumption and cost automatically,
    and saves valid records in a single transaction.
    """
    if not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xlsx or .xls) are supported."
        )
        
    try:
        file.file.seek(0)
        import openpyxl
        contents = file.file.read()
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        sheet = wb.active
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file is empty."
            )
        
        headers = []
        apt_idx = -1
        curr_idx = -1
        header_row_idx = 0
        
        for r_idx, row in enumerate(rows[:10]):  # check first 10 rows
            if not row or all(c is None for c in row):
                continue
            row_headers = [str(cell).strip().lower() if cell is not None else "" for cell in row]
            for idx, h in enumerate(row_headers):
                h_clean = h.replace(" ", "").replace("_", "").replace("-", "").replace(".", "")
                if any(x in h_clean for x in ["apartment", "apt", "flat", "unit", "room", "house", "door"]):
                    apt_idx = idx
                elif any(x in h_clean for x in ["current", "curr", "closing", "end"]) or ("reading" in h_clean and "prev" not in h_clean and "previous" not in h_clean):
                    curr_idx = idx
            if apt_idx != -1 and curr_idx != -1:
                header_row_idx = r_idx
                headers = row_headers
                break
        
        if apt_idx == -1 or curr_idx == -1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required columns. Excel must contain: Flat No (Apartment) and Current Reading."
            )
        
        db.begin()
        imported_count = 0
        failed_count = 0
        errors = []
 
        for idx, row in enumerate(rows[header_row_idx + 1:]):
            if all(cell is None for cell in row):
                continue

            # Skip row if any cell contains tanker/summary keywords
            skip_keywords = ["total", "totals", "tankers", "manjeera", "external", "capacity", 
                             "total lts", "cost per tanker", "summary", "grand total", "water cost", 
                             "actual", "considered", "litre", "liter"]
            row_values_str = [str(cell).strip().lower() if cell is not None else "" for cell in row]
            if any(any(kw in val for kw in skip_keywords) for val in row_values_str):
                continue

            apt_val = row[apt_idx]
            curr_val = row[curr_idx]
            row_num = idx + header_row_idx + 2

            if apt_val is None or str(apt_val).strip() == "":
                # Silently skip rows with empty apartment column (part of tanker/summary sections)
                continue

            apt_num = normalize_apartment_number(str(apt_val))
            
            # Skip row silently if the value does not look like an apartment number (3 or 4 digits)
            import re
            apt_val_clean = apt_num.replace("A-", "").upper().strip()
            if not re.match(r'^\d{3,4}$', apt_val_clean):
                continue

            if curr_val is None or str(curr_val).strip() == "":
                failed_count += 1
                errors.append({"row": row_num, "flat_no": apt_num, "message": "Current Reading is required."})
                continue

            apt = crud.get_apartment_by_number(db, apartment_number=apt_num)
            if not apt:
                failed_count += 1
                errors.append({"row": row_num, "flat_no": apt_num, "message": f"Flat number {apt_num} not found."})
                continue

            try:
                current_reading = float(curr_val)
            except Exception:
                failed_count += 1
                errors.append({"row": row_num, "flat_no": apt_num, "message": "Current Reading must be numeric."})
                continue

            if current_reading < 0:
                failed_count += 1
                errors.append({"row": row_num, "flat_no": apt_num, "message": "Current Reading cannot be negative."})
                continue

            previous_reading = get_previous_reading_for_apt(db, apt_num, month)
            if current_reading < previous_reading:
                failed_count += 1
                errors.append({"row": row_num, "flat_no": apt_num, "message": "Current Reading cannot be less than the previous month's reading."})
                continue

            try:
                crud.create_or_update_reading(
                    db,
                    apartment_id=apt.id,
                    month=month,
                    previous_reading=previous_reading,
                    current_reading=current_reading,
                    rate_per_litre=rate_per_litre,
                    commit=False
                )
                imported_count += 1
            except Exception as e:
                failed_count += 1
                errors.append({"row": row_num, "flat_no": apt_num, "message": str(e)})

        # If there are valid rows, commit once; otherwise rollback.
        if imported_count > 0:
            db.commit()
        else:
            db.rollback()

        return {
            "success": True,
            "totalRows": imported_count + failed_count,
            "imported": imported_count,
            "failed": failed_count,
            "errors": errors
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Excel file: {str(e)}"
        )

@router.get("/excel/exists")
def has_existing_excel_readings(
    month: str = "May 2026",
    db: Session = Depends(get_db)
):
    """
    Check whether any water readings already exist for the selected month.
    """
    count = db.query(models.WaterReading).filter(
        models.WaterReading.month == month
    ).count()
    return {
        "exists": count > 0,
        "existingCount": count
    }

@router.get("/excel/sample")
def download_excel_sample():
    """
    Generates a sample Excel file for upload with required headers only.
    """
    import pandas as pd
    from fastapi.responses import StreamingResponse

    sample_data = [
        {"Flat No": "A-101", "Current Reading": 1250},
        {"Flat No": "A-102", "Current Reading": 980},
        {"Flat No": "A-103", "Current Reading": 1515},
    ]
    df = pd.DataFrame(sample_data)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Water Readings')
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            'Content-Disposition': 'attachment; filename=Water_Reading_Sample.xlsx'
        }
    )

class CSVReadingItem(BaseModel):
    apartment_number: str
    previous_reading: float
    current_reading: float

class CSVCommitPayload(BaseModel):
    readings: list[CSVReadingItem]
    month: str
    rate_per_litre: float = 0.575
    community_id: Optional[int] = None

@router.post("/csv/preview")
def preview_csv_readings(
    file: UploadFile = File(...),
    month: str = "May 2026",
    db: Session = Depends(get_db)
):
    """
    Parses CSV and auto-maps Apartment and Reading columns.
    Returns preview data list of readings.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )
        
    try:
        file.file.seek(0)
        import pandas as pd
        raw_bytes = file.file.read()
        try:
            decoded_str = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            decoded_str = raw_bytes.decode("latin-1")
            
        # Detect delimiter
        delimiter = ','
        if ';' in decoded_str and decoded_str.count(';') > decoded_str.count(','):
            delimiter = ';'
            
        # Find first line that has headers
        lines = decoded_str.splitlines()
        header_idx = 0
        for i, line in enumerate(lines[:10]):
            cols = [c.strip().lower().replace(" ", "").replace("_", "").replace("-", "").replace(".", "") for c in line.split(delimiter)]
            has_apt = any(any(x in col for x in ["apartment", "apt", "flat", "unit", "room", "house", "door"]) for col in cols)
            has_read = any(any(x in col for x in ["reading", "current", "curr", "closing", "end", "val"]) for col in cols)
            if has_apt and has_read:
                header_idx = i
                break
                
        # sep=None and engine='python' lets pandas auto-detect separators (comma, semicolon, tab)
        df = pd.read_csv(io.StringIO(decoded_str), skiprows=header_idx, sep=None, engine='python')
        
        # Trim whitespace from headers
        df.columns = [str(c).strip() for c in df.columns]
        
        # Find apartment column
        apt_col = None
        apt_candidates = ["apartment", "apt", "flat", "unit", "room", "house", "door"]
        for col in df.columns:
            c_clean = str(col).lower().replace(" ", "").replace("_", "").replace("-", "").replace(".", "")
            if any(cand in c_clean or c_clean in cand for cand in apt_candidates):
                apt_col = col
                break
                
        if not apt_col:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not find an Apartment column. Please ensure the file has a column like Apartment, Flat, Unit, or Door No."
            )
            
        # Find all reading columns (exclude calculated ones)
        reading_cols = []
        exclude_keywords = ["consumption", "cost", "bill", "amount", "total", "rate", "litre", "unit"]
        for col in df.columns:
            col_lower = str(col).lower().replace(" ", "").replace("_", "").replace("-", "").replace(".", "")
            if "reading" in col_lower or "curr" in col_lower or "val" in col_lower:
                # Check if it has any exclusion keywords
                if not any(ex in col_lower for ex in exclude_keywords):
                    reading_cols.append(col)
                    
        if len(reading_cols) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No reading columns found. CSV must contain at least one reading column (e.g. Current Reading)."
            )
            
        if len(reading_cols) >= 2:
            prev_col = reading_cols[0]
            curr_col = reading_cols[1]
        else:
            prev_col = None
            curr_col = reading_cols[0]
            
        preview_data = []
        error_rows = []
        
        for idx, row in df.iterrows():
            # Skip row if any cell contains tanker/summary keywords
            skip_keywords = ["total", "totals", "tankers", "manjeera", "external", "capacity", 
                             "total lts", "cost per tanker", "summary", "grand total", "water cost", 
                             "actual", "considered", "litre", "liter"]
            row_values_str = [str(val).strip().lower() for val in row.values if not pd.isna(val)]
            if any(any(kw in val for kw in skip_keywords) for val in row_values_str):
                continue

            apt_val = row[apt_col]
            prev_val = row[prev_col] if prev_col else None
            curr_val = row[curr_col]
            
            # Skip if all are null/NaN
            if pd.isna(apt_val) and (prev_col is None or pd.isna(prev_val)) and pd.isna(curr_val):
                continue
                
            # Validation
            apt_str = str(apt_val).strip() if not pd.isna(apt_val) else ""
            if not apt_str:
                continue
                
            apt_num_str = normalize_apartment_number(apt_str)
            
            # Skip row silently if the value does not look like an apartment number (3 or 4 digits)
            import re
            apt_val_clean = apt_num_str.replace("A-", "").upper().strip()
            if not re.match(r'^\d{3,4}$', apt_val_clean):
                continue

            try:
                apt = crud.get_apartment_by_number(db, apartment_number=apt_num_str)
                if not apt:
                    error_rows.append(f"Row {idx+2} ({apt_str}): Flat number does not exist in database")
                    continue
                
                # Convert readings to float, handle formats
                if prev_col:
                    prev_clean = str(prev_val).replace(",", "").strip() if not pd.isna(prev_val) else "0"
                    prev_num = float(prev_clean)
                else:
                    prev_num = get_previous_reading_for_apt(db, apt_num_str, month)
                    
                curr_clean = str(curr_val).replace(",", "").strip() if not pd.isna(curr_val) else "0"
                curr_num = float(curr_clean)
                
                if prev_num < 0 or curr_num < 0:
                    error_rows.append(f"Row {idx+2} ({apt_str}): Readings cannot be negative")
                    continue
                if curr_num < prev_num:
                    error_rows.append(f"Row {idx+2} ({apt_str}): Current reading ({curr_num}) cannot be less than previous ({prev_num})")
                    continue
                    
                preview_data.append({
                    "apartment_number": apt_num_str.upper(),
                    "previous_reading": prev_num,
                    "current_reading": curr_num
                })
            except ValueError:
                error_rows.append(f"Row {idx+2} ({apt_str}): Non-numeric reading values")
                
        if not preview_data and error_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "All rows failed validation.", "errors": error_rows}
            )
            
        return {
            "preview_data": preview_data,
            "prev_column": prev_col,
            "curr_column": curr_col,
            "errors": error_rows
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse CSV file: {str(e)}"
        )

@router.post("/csv/commit")
def commit_csv_readings(
    payload: CSVCommitPayload,
    db: Session = Depends(get_db)
):
    """
    Commit parsed readings from the preview table to the database.
    """
    try:
        # Resolve tower_id dynamically for the selected community
        tower = None
        if payload.community_id is not None:
            tower = db.query(models.Tower).filter(models.Tower.community_id == payload.community_id).first()
        if not tower:
            tower = db.query(models.Tower).first()
        tower_id = tower.id if tower else 1

        processed_count = 0
        for item in payload.readings:
            # Get apartment by number and tower
            apt_num_str = normalize_apartment_number(item.apartment_number)
            apt = db.query(models.Flat).filter(
                models.Flat.number == apt_num_str,
                models.Flat.tower_id == tower_id
            ).first()
            if not apt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Apartment/Flat number {item.apartment_number} does not exist under the active community tower in database."
                )
            # Save reading
            crud.create_or_update_reading(
                db,
                apartment_id=apt.id,
                month=payload.month,
                previous_reading=item.previous_reading,
                current_reading=item.current_reading,
                rate_per_litre=payload.rate_per_litre
            )
            processed_count += 1
            
        return {
            "message": f"Successfully imported {processed_count} readings for {payload.month}."
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to commit readings: {str(e)}"
        )


