@echo off
title Bakelicious ERP Launcher
echo ========================================================
echo   Starting Bakelicious Artisan Cake ERP & Showcase
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend on Port 8000...
start "Bakelicious Backend API" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Launching Next.js Frontend on Port 3000...
start "Bakelicious Web Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak > nul

echo.
echo ========================================================
echo   Bakelicious is now RUNNING!
echo   - Receipt Generator:  http://localhost:3000/admin/receipts
echo   - Customer Showcase:  http://localhost:3000/showcase
echo   - Admin Showcase CMS: http://localhost:3000/admin/showcase
echo   - Operations Calendar:http://localhost:3000/admin/calendar
echo   - Backend API Docs:   http://localhost:8000/docs
echo   - Database:           backend\bakelicious.db (SQLite)
echo ========================================================
start http://localhost:3000/admin/receipts
pause
