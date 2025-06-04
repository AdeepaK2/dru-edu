@echo off
echo Deploying Firestore indexes...
firebase deploy --only firestore:indexes
echo Firestore indexes deployment complete!
pause
