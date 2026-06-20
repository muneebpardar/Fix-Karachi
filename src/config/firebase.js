import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  memoryLocalCache
} from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hackathon Firebase Configuration (Production-Ready Failover)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if keys are placeholder to run in simulation database
export const isMockMode = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("FakeKey");

let app;
let db;
let auth;
let storage;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // Configure offline-first cache dynamically
    db = initializeFirestore(app, {
      localCache: Platform.OS === 'web' 
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) 
        : memoryLocalCache() // Prevent IndexedDB warning on native
    });

    // Handle React Native Auth initialization with AsyncStorage persistence
    if (Platform.OS === 'web') {
      auth = getAuth(app);
    } else {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
    storage = getStorage(app);
  } else {
    app = getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.warn("Firebase services initialization failed, fallback to mock simulation database:", error);
}

export { app, db, auth, storage };
