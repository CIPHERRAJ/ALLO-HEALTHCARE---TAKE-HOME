@echo off
echo ========================================
echo   Allo Inventory System - Starter
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] node_modules not found. Installing dependencies...
    call npm install
) else (
    echo [1/3] Dependencies already installed.
)

:: Ensure Prisma client is generated for SQLite
echo [2/3] Generating Prisma Client...
call npx prisma generate

:: Start the dev server
echo [3/3] Starting the server at http://localhost:3000...
echo.
echo (Keep this window open while using the app)
echo.
call npm run dev
