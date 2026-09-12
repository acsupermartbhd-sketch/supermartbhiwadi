import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCc6BnRuH6_eJY1hkMyBxuvq-qClS75Pfs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "supermartbhiwadi-a3ea6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "supermartbhiwadi-a3ea6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "supermartbhiwadi-a3ea6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "692256531451",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:692256531451:web:d075ab5cd1a8839a96a15e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JBGC8PGW9R",
};

const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
