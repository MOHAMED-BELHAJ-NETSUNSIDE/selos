@echo off
echo ========================================
echo    Selos Backoffice - Demarrage
echo ========================================
echo.

echo [1/3] Installation des dependances...
call npm run install:all
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dependances
    pause
    exit /b 1
)

echo.
echo [2/3] Configuration de la base de donnees...
cd backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo Erreur lors de la generation du client Prisma
    pause
    exit /b 1
)

echo.
echo [3/3] Demarrage de l'application...
cd ..
call npm run dev

pause




