// // lib/firebase.ts
// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";

// // --- For Debugging ---
// // This will print the value of the environment variable to your server terminal.
// console.log("FIREBASE_CONFIG_ENV_VAR:", process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
// // ---------------------

// // Parse the Firebase config from the environment variable
// const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}";
// const firebaseConfig = JSON.parse(firebaseConfigString);

// // Initialize Firebase
// // We add a check to see if the app is already initialized to prevent errors during hot-reloading in development.
// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const db = getFirestore(app);

// export { app, db };


// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Construct the Firebase config object from individual environment variables
// This is a safer method than parsing a single JSON string.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
// We add a check to see if the app is already initialized to prevent errors during hot-reloading in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
