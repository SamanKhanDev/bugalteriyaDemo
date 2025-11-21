# Accounting Academy

Premium SaaS-style accounting learning platform.

## Project Structure

- `web/`: Next.js 14 Frontend application (App Router, Tailwind CSS).
- `functions/`: Cloud Functions for Firebase (Backend logic).
- `firestore.rules`: Security rules for Cloud Firestore.

## Setup

1. **Install Dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in `web/` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Deploy Security Rules**
   Ensure you have Firebase CLI installed:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Features
- **Authentication**: Firebase Auth (Email/Password).
- **Real-time Timer**: 2-hour countdown per user, synced with Firestore.
- **Locked Stages**: Progressive learning path.
- **Admin Dashboard**: Manage users, add time, reset passwords.
