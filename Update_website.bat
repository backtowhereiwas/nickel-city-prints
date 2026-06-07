@echo off
setlocal

echo.
echo =====================================
echo   Nickel City Prints - Site Update
echo =====================================
echo.

echo Regenerating catalog...
python generate_catalog.py "D:\3D Print Files\Hueforge"

if errorlevel 1 (
    echo.
    echo ERROR: Catalog generation failed.
    pause
    exit /b 1
)

echo.
echo Checking for website changes...
git status --short

echo.
echo Staging changes...
git add .

echo.
echo Creating commit...
git commit -m "Update catalog"

echo.
echo Pushing to GitHub...
git push

if errorlevel 1 (
    echo.
    echo ERROR: Git push failed.
    pause
    exit /b 1
)

echo.
echo =====================================
echo   Done! Cloudflare will deploy soon.
echo =====================================
echo.
pause