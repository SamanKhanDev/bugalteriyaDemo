import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBICvv3HmBTCmfwZdlA6lqSaZ8zPPGB6cU",
    authDomain: "buglateriya-team.firebaseapp.com",
    projectId: "buglateriya-team",
    storageBucket: "buglateriya-team.firebasestorage.app",
    messagingSenderId: "319328450738",
    appId: "1:319328450738:web:0aabdf56f3c4c010bb31ab",
    measurementId: "G-VECYFXZ1LS"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, storage, analytics };
