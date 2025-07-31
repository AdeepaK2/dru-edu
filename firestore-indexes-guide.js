// Firestore Index Requirements for Teacher Access Banks System
// Copy and paste these index definitions into Firebase Console

/*
Go to: https://console.firebase.google.com/project/dru-edu/firestore/indexes

Click "Create Index" and add these composite indexes:

INDEX 1: teacherAccessBanks - Basic Access Query
Collection: teacherAccessBanks
Fields:
- teacherId (Ascending)
- isActive (Ascending)

INDEX 2: teacherAccessBanks - Question Bank Access Query  
Collection: teacherAccessBanks
Fields:
- questionBankId (Ascending)
- isActive (Ascending)

INDEX 3: teacherAccessBanks - Subject Filtering (Optional - for future features)
Collection: teacherAccessBanks
Fields:
- subjectId (Ascending)
- isActive (Ascending)
- teacherId (Ascending)

These indexes will support the queries in teacherAccessBankService without requiring
complex composite indexes with orderBy clauses.
*/

// Alternative: Create indexes programmatically using Firebase CLI
// Run these commands in your terminal:

/*
# Install Firebase CLI if not already installed
npm install -g firebase-cli

# Login to Firebase
firebase login

# Initialize Firestore in your project directory
firebase init firestore

# Add the following to firestore.indexes.json:
*/

const firestoreIndexes = {
  "indexes": [
    {
      "collectionGroup": "teacherAccessBanks",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive", 
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "teacherAccessBanks",
      "queryScope": "COLLECTION", 
      "fields": [
        {
          "fieldPath": "questionBankId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "teacherAccessBanks",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "subjectId", 
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
};

/*
Then deploy the indexes:
firebase deploy --only firestore:indexes

OR manually create them in the Firebase Console using the URL provided in the error message.
*/
