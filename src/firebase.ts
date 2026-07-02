import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// Firebase configuration with fallbacks for development/production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBPQG168bMjOSbclm65NB0MUPVOIfcU72I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "collective-wisdom-bc32e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "collective-wisdom-bc32e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "collective-wisdom-bc32e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "532988539383",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:532988539383:web:02629bf6f3a4b2d6ff3ef2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged };
