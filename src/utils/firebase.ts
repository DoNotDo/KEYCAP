import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 설정 - 환경 변수에서 가져오기
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAf-nRUR_RLfhAJgPXud7H-vHu4HHAGNcw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "management-9f7d8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "management-9f7d8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "management-9f7d8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "981753652672",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:981753652672:web:9038dadd699022179cd425",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VXSN112LFT"
};

// Firebase 초기화
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // 기본값 설정 (에러 방지)
  app = null;
  db = null;
  auth = null;
}

// Firestore 초기화
export { db };

// Auth 초기화
export { auth };

export default app;
