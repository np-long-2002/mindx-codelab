@echo off
title MindX CodeLab Launcher
echo ============================================================
echo           KHOI DONG HE THONG MINDX CODELAB
echo ============================================================
echo.

echo 1. Dang khoi dong Backend FastAPI (Port 8000)...
start "MindX CodeLab Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo 2. Dang khoi dong Frontend React (Port 5173)...
start "MindX CodeLab Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo Da khoi dong xong!
echo - Trang web: http://localhost:5173
echo - API Docs:  http://localhost:8000/docs
echo ============================================================
pause

