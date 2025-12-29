// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { initializeFirestore, persistentLocalCache } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDn-SuluH6Wa6SBfw-Bw5w8MTJ8lUmfaGU",
    authDomain: "real-estate-81765.firebaseapp.com",
    projectId: "real-estate-81765",
    storageBucket: "real-estate-81765.firebasestorage.app",
    messagingSenderId: "720971192448",
    appId: "1:720971192448:web:b046daf90e7b24b7a12e65",
    measurementId: "G-XQ13ZW197Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Persistent Cache (Replaces enableIndexedDbPersistence)
const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});

const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
