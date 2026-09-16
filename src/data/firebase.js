import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD_dFgHhhOLoGny2iLt8n7dKk-B7iGLhAw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "supermartbhiwadi-f7d16.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "supermartbhiwadi-f7d16",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "supermartbhiwadi-f7d16.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "589074803029",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:589074803029:web:5954e754aa6f1273b227dc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-CVQR784Y22",
};

const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
