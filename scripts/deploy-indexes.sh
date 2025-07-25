#!/bin/bash

# Deploy Firestore indexes to fix query performance issues
echo "🚀 Deploying Firestore indexes..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Deploy only indexes
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully!"
    echo "📝 The following indexes were created:"
    echo "   - students: classIds (array-contains) + name (asc)"
    echo "   - students: classIds (array-contains) + status (asc) + name (asc)"
    echo ""
    echo "⏱️  Note: Index creation can take several minutes to complete."
    echo "🔍 Monitor progress at: https://console.firebase.google.com/project/dru-edu/firestore/indexes"
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi
