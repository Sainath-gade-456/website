// ==========================================================================
// MÈWOS Wear - Firebase Backend Configuration
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    getDocs,
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Default Firebase configuration. For production, avoid committing sensitive
// values into the repository. You can inject a production configuration at
// runtime by setting `window.__FIREBASE_CONFIG__` in your `index.html` (via
// server-side template or CI build) before this module is imported.
const defaultFirebaseConfig = {
    apiKey: "AIzaSyCppVCXtR90CDAFx0p9YT_e88FBvmDQTDA",
    authDomain: "landing-page-ba0a8.firebaseapp.com",
    projectId: "landing-page-ba0a8",
    storageBucket: "landing-page-ba0a8.firebasestorage.app",
    messagingSenderId: "37343602337",
    appId: "1:37343602337:web:1584bc805358518d168dd0"
};

// Prefer a runtime-injected config (e.g. `window.__FIREBASE_CONFIG__`) to
// keep production keys out of source control. Falls back to the default above
// for local development.
const firebaseConfig = (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__)
    ? window.__FIREBASE_CONFIG__
    : defaultFirebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = getFirestore(app);
const auth = getAuth(app);

// Export instances and helper functions for use in app.js
export { 
    db, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    getDocs,
    onSnapshot, 
    serverTimestamp,
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
};

