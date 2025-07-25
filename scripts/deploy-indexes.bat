@echo off
REM Deploy Firestore indexes to fix query performance issues
echo 🚀 Deploying Firestore indexes...

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools
    exit /b 1
)

REM Deploy only indexes
echo 📊 Deploying Firestore indexes...
firebase deploy --only firestore:indexes

if %ERRORLEVEL% EQU 0 (
    echo ✅ Firestore indexes deployed successfully!
    echo 📝 The following indexes were created:
    echo    - students: classIds ^(array-contains^) + name ^(asc^)
    echo    - students: classIds ^(array-contains^) + status ^(asc^) + name ^(asc^)
    echo.
    echo ⏱️  Note: Index creation can take several minutes to complete.
    echo 🔍 Monitor progress at: https://console.firebase.google.com/project/dru-edu/firestore/indexes
) else (
    echo ❌ Failed to deploy Firestore indexes
    exit /b 1
)
