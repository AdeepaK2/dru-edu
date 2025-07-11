# Dr. U Education Platform

A comprehensive educational platform built with Next.js and Firebase, configured for Melbourne, Australia timezone.

## 🌏 Timezone Configuration

This application is configured to use **Melbourne, Australia** timezone (AEST/AEDT) across all components:

### Backend Configuration
- ✅ Next.js server-side operations use Melbourne timezone
- ✅ Firebase Functions configured with `TZ=Australia/Melbourne`
- ✅ Firebase hosting region set to `australia-southeast1`
- ✅ All Firestore timestamps include timezone metadata

### Frontend Configuration
- ✅ Client-side date displays in Melbourne timezone
- ✅ Global Date prototype overrides for consistent timezone
- ✅ MelbourneDate utility class for timezone-aware operations
- ✅ Timezone provider component for React context

### Key Features
- 🕒 All dates and times display in Melbourne timezone
- 📅 Automatic handling of daylight saving time (AEST ↔ AEDT)
- 🌐 Consistent timezone across client and server
- 💾 Firestore documents include timezone metadata
- 🛠️ Utility functions for Melbourne-specific date operations

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration

Copy the environment variables example file:
```bash
cp .env.example .env
```

Fill in your Firebase configuration in the `.env` file:
- Get your Firebase project configuration from the Firebase Console
- Download the Firebase Admin SDK service account key
- Extract the required fields and add them to your `.env` file

**Required Environment Variables:**
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID
- `FIREBASE_ADMIN_PRIVATE_KEY_ID` - Firebase Admin SDK private key ID
- `FIREBASE_ADMIN_PRIVATE_KEY` - Firebase Admin SDK private key
- `FIREBASE_ADMIN_CLIENT_EMAIL` - Firebase Admin SDK client email
- `FIREBASE_ADMIN_CLIENT_ID` - Firebase Admin SDK client ID

### 3. Set Up Timezone Environment Variables
```bash
TZ=Australia/Melbourne
NEXT_TZ=Australia/Melbourne
```

### 4. Run the Development Server
```bash
npm run dev
```

### 5. Open the Application
Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Deployment

### Firebase Deployment with Melbourne Timezone

**Windows:**
```bash
scripts\deploy-melbourne.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy-melbourne.sh
./scripts/deploy-melbourne.sh
```

### Manual Deployment
```bash
# Set timezone
export TZ=Australia/Melbourne  # Linux/Mac
set TZ=Australia/Melbourne     # Windows

# Build and deploy
npm run build
firebase deploy
```

## 🛠️ Timezone Utilities

### MelbourneDate Class
```typescript
import { MelbourneDate } from '@/utils/melbourne-date';

// Create Melbourne date
const now = MelbourneDate.now();
const date = new MelbourneDate('2024-01-01');

// Format for display
console.log(now.toString());      // "01/01/2024, 15:30:00"
console.log(now.toShortString()); // "1 Jan 2024"
console.log(now.toTimeString());  // "3:30 PM"

// Utility methods
console.log(now.isToday());       // true/false
console.log(now.getDayOfWeek());  // "Monday"
console.log(now.getMonthName());  // "January"
```

### Firestore with Timezone
```typescript
import { firestoreWithTimezone } from '@/utils/firestore-melbourne';

// Add document with Melbourne timezone metadata
await firestoreWithTimezone.addDoc('users', {
  name: 'John Doe',
  email: 'john@example.com'
  // createdAt, updatedAt, and timezone are added automatically
});

// Get document with formatted timestamps
const user = await firestoreWithTimezone.getDoc('users', 'userId');
console.log(user.createdAtDisplay); // "01/01/2024, 15:30:00"
```

### Timezone Helper Functions
```typescript
import { 
  formatMelbourneDate, 
  getMelbourneTime, 
  getMelbourneOffset 
} from '@/utils/timezone';

const now = new Date();
console.log(formatMelbourneDate(now));  // Formatted Melbourne time
console.log(getMelbourneTime());        // Current Melbourne time
console.log(getMelbourneOffset());      // "UTC+11" or "UTC+10"
```

## 🔧 Configuration Files

- `next.config.ts` - Next.js timezone configuration
- `firebase.json` - Firebase Functions timezone and region settings
- `src/utils/timezone.ts` - Core timezone utilities
- `src/utils/melbourne-date.ts` - Melbourne-specific date class
- `src/utils/firestore-melbourne.ts` - Firestore operations with timezone
- `src/components/TimezoneProvider.tsx` - React timezone context

## 📝 Environment Variables

Required for deployment:
```
TZ=Australia/Melbourne
NEXT_TZ=Australia/Melbourne
FIREBASE_REGION=australia-southeast1
```

## 🧪 Testing Timezone

Visit the homepage to see the timezone demo component which displays:
- Current Melbourne time (updates every second)
- Timezone offset information
- Date formatting examples
- Daylight saving time status

## 📚 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Firebase Functions, Firestore, Firebase Authentication
- **Hosting:** Firebase Hosting (Australia Southeast region)
- **Timezone:** Australia/Melbourne (AEST/AEDT)
