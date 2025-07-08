#!/bin/bash
# Deploy script for Firebase with Melbourne timezone

echo "🕒 Setting timezone to Melbourne, Australia..."
export TZ=Australia/Melbourne

echo "📦 Building the application..."
npm run build

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "⚙️  Deploying functions with Melbourne timezone..."
firebase deploy --only functions

echo "✅ Deployment complete! All services are now using Melbourne timezone."
echo "🌏 Current server time: $(date)"
