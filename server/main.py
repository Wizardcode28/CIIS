import requests,time,csv,re,json,sys,math,random,io
import uuid,shutil,logging,os
from pathlib import Path
from typing import Optional,Tuple
from datetime import datetime, timezone,timedelta

from fastapi import FastAPI, Query, HTTPException, Header, BackgroundTasks, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse,StreamingResponse,FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Literal

try:
    import processor
except Exception as e:
    raise RuntimeError(f"Failed to import processor.py: {e}")

from reddit_scrapper import scrape_reddit_to_csv

# try import python-docx (optional)
DOCX_AVAILABLE = True
try:
    from docx import Document
    from docx.shared import Inches
except Exception:
    DOCX_AVAILABLE = False

class RerunRequest(BaseModel):
    intent: Literal["light", "medium", "deep"]

INTENT_LIMITS = {
    "light":  {"per_query": 20,  "total": 40},
    "medium": {"per_query": 50,  "total": 300},
    "deep":   {"per_query": 100, "total": 800},
}

# ---- Configuration ----
BASE_DIR= Path(__file__).resolve().parent
STORAGE_DIR= BASE_DIR/"storage"
LATEST_DIR= STORAGE_DIR/"latest"
STORAGE_DIR.mkdir(exist_ok=True)
LATEST_DIR.mkdir(exist_ok=True)

# API key (optional) if set in env required for post/rerun
API_KEY= os.environ.get("API_KEY",None)

# logging
logging.basicConfig(level=logging.INFO)
logger= logging.getLogger("report-saver")

# FastAPI code
app= FastAPI(title="Auto Report API (CSV → PDF/DOCX)")

# CORS allow all in dev, restrict in production
origins=[
    "https://ciis-indol.vercel.app", 
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(CORSMiddleware, allow_origins=origins,allow_credentials=True, allow_methods=["*"],allow_headers=["*"])

# Helper: safe path join inside storage using Path
def storage_path(filename:str)-> Path:
    return LATEST_DIR/filename

def scrape_live_data(output_csv_path:str, per_query: int, total:int)->None:
    scrape_reddit_to_csv(output_csv_path,per_query,total)

# ------------------------------
# Range-supporting file response for large files (PDF preview)
def get_range_byte_positions(range_header: str, file_size: int) -> Optional[Tuple[int, int]]:
    # Example Range header: 'bytes=0-1023' or 'bytes=1024-'
    if not range_header:
        return None
    header = range_header.strip()
    if not header.startswith("bytes="):
        return None
    range_val = header.split("=", 1)[1]
    parts = range_val.split("-")
    try:
        if parts[0] == "":
            # suffix bytes: '-N' -> last N bytes
            end = file_size - 1
            start = file_size - int(parts[1])
        elif parts[1] == "":
            # 'start-' to end of file
            start = int(parts[0])
            end = file_size - 1
        else:
            start = int(parts[0])
            end = int(parts[1])
        if start < 0:
            start = 0
        if end >= file_size:
            end = file_size - 1
        if start > end:
            return None
        return (start, end)
    except Exception:
        return None
    
def range_stream_response(path: Path, request: Request) -> StreamingResponse:
    """Return a StreamingResponse that honors Range requests for a file."""
    file_size = path.stat().st_size
    range_header = request.headers.get("range")
    range_pos = get_range_byte_positions(range_header, file_size)
    headers = {
        "Accept-Ranges": "bytes",
        "Content-Type": "application/octet-stream",
        "Content-Disposition": f'inline; filename="{path.name}"',
    }

    if range_pos is None:
        # full content
        def iterfile():
            with open(path, "rb") as f:
                while True:
                    chunk = f.read(1024 * 1024)
                    if not chunk:
                        break
                    yield chunk
        headers["Content-Length"] = str(file_size)
        return StreamingResponse(iterfile(), status_code=200, headers=headers)
    else:
        start, end = range_pos
        length = end - start + 1
        headers["Content-Length"] = str(length)
        headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        # status 206 Partial Content
        def iterfile_range():
            with open(path, "rb") as f:
                f.seek(start)
                remaining = length
                chunk_size = 1024 * 1024
                while remaining > 0:
                    to_read = min(chunk_size, remaining)
                    chunk = f.read(to_read)
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk
        return StreamingResponse(iterfile_range(), status_code=206, headers=headers)
    

@app.get("/")
def home():
    return {"message":"sever working"}

@app.post("/rerun")
async def rerun_endpoint(body: RerunRequest, x_api_key: Optional[str] = Header(None)):
    """
    Trigger live scraping + processing.
    Optional x-api-key header if API_KEY is set in env.
    This endpoint blocks until processing completes and returns file paths.
    """
    # auth check
    if API_KEY:
        if not x_api_key or x_api_key != API_KEY:
            logger.warning("Rejected rerun: invalid API key")
            raise HTTPException(status_code=401, detail="Invalid or missing x-api-key")

    # create a new working folder
    # uid = uuid.uuid4().hex
    work_dir = STORAGE_DIR / "latest"
    work_dir.mkdir(parents=True, exist_ok=True)

    # step 1: scrape live data -> create input CSV path
    input_csv = work_dir / "scraped_input.csv"
    limits= INTENT_LIMITS[body.intent]
    logger.info(f"Received rerun request. Intent: {body.intent}, Limits: {limits}")
    
    try:
        logger.info(f"Starting scraping to {input_csv}...")
        scrape_live_data(str(input_csv),int(limits["per_query"]),int(limits["total"]))
        logger.info("Scraping completed successfully.")
    except Exception as e:
        logger.exception("Scraping failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Scraping failed: {e}")

    # step 2: process csv into pdf, docx, analysis_output.csv
    try:
        logger.info("Calling user-provided processor.generate_reports_from_csv")
        # assume processor writes to out_dir and returns dict or nothing
        out = processor.generate_reports_from_csv(str(input_csv), str(work_dir))
        logger.info(f"Processing return value: {out}")

        # normalize result
        pdf_path = str(work_dir / "report.pdf")
        csv_path = str(work_dir / "analysis_output.csv")
        docx_path = str(work_dir / "report.docx")
        # if processor returned explicit paths, use them
        if isinstance(out, dict):
            pdf_path = out.get("pdf", pdf_path)
            csv_path = out.get("csv", csv_path)
            docx_path = out.get("docx", docx_path)
        result = {"pdf": pdf_path, "csv": csv_path, "docx": docx_path}
    except Exception as e:
        logger.exception("Processing failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")

    # step 3: update 'latest' storage (atomically)
    try:
        # clear latest directory
        # if LATEST_DIR.exists():
        #     shutil.rmtree(LATEST_DIR)
        LATEST_DIR.mkdir(parents=True, exist_ok=True)
        # Define IST timezone
        IST = timezone(timedelta(hours=5, minutes=30))
        generated_at = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")
        # write metadata file
        meta = {
            "pdf": "/files/report.pdf" if (LATEST_DIR / "report.pdf").exists() else "",
            "csv": "/files/analysis_output.csv" if (LATEST_DIR / "analysis_output.csv").exists() else "",
            "docx": "/files/report.docx" if (LATEST_DIR / "report.docx").exists() else "",
            "generated_at": generated_at,
        }

        # write meta to disk for persistence
        with open(LATEST_DIR / "meta.json", "w", encoding="utf-8") as mf:
            import json
            json.dump(meta, mf)

    except Exception as e:
        logger.exception("Failed to update latest storage: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to update latest storage: {e}")

    logger.info("Rerun completed, files available under latest/ directory")
    return JSONResponse(status_code=200, content={
        "status": "ok",
        "pdf": meta["pdf"],
        "csv": meta["csv"],
        "docx": meta["docx"]
    })


@app.get("/report")
async def get_report():
    """
    Return metadata about current report (pdf/csv/docx)
    """
    meta_file = LATEST_DIR / "meta.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="No report available yet")
    import json
    with open(meta_file, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return JSONResponse(status_code=200, content=meta)

@app.get("/pdf/view/{filename}")
async def view_pdf(filename: str):
    path = LATEST_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")

    return FileResponse(
        path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{path.name}"'
        }
    )

@app.get("/pdf/download/{filename}")
async def download_pdf(filename: str):
    path = LATEST_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")

    return FileResponse(
        path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{path.name}"'
        }
    )


@app.get("/files/{filename}")
async def serve_file(filename: str, request: Request):
    """
    Serve files from the latest directory. Supports Range requests (for PDFs).
    """
    safe_name = os.path.basename(filename)
    path = LATEST_DIR / safe_name
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    # Detect file type
    if path.suffix.lower() == ".pdf":
        media_type = "application/pdf"
    elif path.suffix.lower() == ".csv":
        media_type = "text/csv"
    elif path.suffix.lower() == ".docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        media_type = "application/octet-stream"

    # if the client supports Range (commonly for PDFs), use range_stream_response
    range_header = request.headers.get("range")
    if range_header and path.suffix.lower() == ".pdf":
        return range_stream_response(path, request)
    else:
        # full file streaming
        def file_iterator():
            with open(path, "rb") as f:
                while True:
                    chunk = f.read(1024 * 1024)
                    if not chunk:
                        break
                    yield chunk
        headers = {
            "Content-Disposition": f'inline; filename="{path.name}"',
            "Content-Length": str(path.stat().st_size),
        }
        return StreamingResponse(file_iterator(), media_type=media_type, headers=headers)

if __name__=='__main__':
    import uvicorn
    port= int(os.environ.get("PORT",8000))
    logger.info("Starting on port %s",port)
    uvicorn.run("main:app",host="0.0.0.0",port=port,log_level="info")