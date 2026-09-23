"""
PowerOptix - Backend Server Launcher
Starts FastAPI backend server on http://localhost:8001
"""

import sys
import os
import uvicorn

# Add backend folder to python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

if __name__ == "__main__":
    print("[+] Starting PowerOptix FastAPI Backend Server on port 8001...")
    print("[+] API Documentation: http://localhost:8001/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
