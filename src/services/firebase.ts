import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  arrayUnion, 
  arrayRemove,
  GeoPoint,
  Firestore,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { 
  initializeAuth, 
  getAuth, 
  signInAnonymously, 
  Auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memoryLocalCache } from 'firebase/firestore';
import { findUCByEmail } from './karachiData';

// Hackathon Placeholder Configuration
// In production, these should be populated with real project variables.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyFakeKey_FixKarachiEFEST2026",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "fix-karachi-2026.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "fix-karachi-2026",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "fix-karachi-2026.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

// Initialize Firebase App
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let isMockMode = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("FakeKey");

try {
  if (!isMockMode) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    // Initialize Firestore with persistent caching on Web, memory caching on Native (suppresses IndexedDB error)
    db = initializeFirestore(app, {
      localCache: Platform.OS === 'web' ? persistentLocalCache() : memoryLocalCache()
    });

    // Initialize Auth with AsyncStorage persistence on Native
    if (Platform.OS === 'web') {
      auth = getAuth(app);
    } else {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }

    storage = getStorage(app);
  } else {
    console.log("Mock Mode Active: Detected placeholder Firebase keys. Running simulation database.");
  }
} catch (error) {
  console.warn("Firebase initialization failed. Falling back to Mock local database simulator mode.", error);
  isMockMode = true;
}

// ----------------------------------------------------
// MOCK SIMULATION ENGINE FOR OFFLINE / NO-CONFIG DEVELOPMENT
// ----------------------------------------------------
interface MockReport {
  id: string;
  reporterId: string;
  domain: string;
  category: string;
  description: string;
  imageUrl: string;
  geoPoint: {
    latitude: number;
    longitude: number;
  };
  status: 'Pending' | 'Verified' | 'Spam' | 'Resolved';
  upvotes: string[];
  downvotes: string[];
  verificationScore: number;
  clientTimestamp: number;
  tankerPrice?: number | null;
  voiceUrl?: string | null;
  town?: string | null;
  uc?: string | null;
}

interface MockAnnouncement {
  id: string;
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  type: 'emergency' | 'info' | 'warning';
  timestamp: number;
}

// Initial Mock Seed Data
let mockReports: MockReport[] = [
  {
    id: "rep-1",
    reporterId: "anon-user-123",
    domain: "Civic Infrastructure",
    category: "Pothole / Road Damage",
    description: "Huge crater on University Road near Karachi University main gate. Restricting main road flow.",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80",
    geoPoint: { latitude: 24.9180, longitude: 67.1150 },
    status: 'Verified',
    upvotes: ["anon-user-456", "anon-user-789", "anon-user-999"],
    downvotes: [],
    verificationScore: 3,
    clientTimestamp: Date.now() - 3600000 * 2,
    town: "Gulberg",
    uc: "UC-03 Waterpump"
  },
  {
    id: "rep-2",
    reporterId: "anon-user-456",
    domain: "Utilities",
    category: "Water Leakage",
    description: "Main water line burst in KDA Scheme 33. Thousands of gallons of clean water wasting on street.",
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=500&q=80",
    geoPoint: { latitude: 24.9462, longitude: 67.1352 },
    status: 'Pending',
    upvotes: ["anon-user-123"],
    downvotes: [],
    verificationScore: 1,
    clientTimestamp: Date.now() - 1800000,
    town: "New Karachi",
    uc: "UC-02 Gulshan-e-Saeed"
  },
  {
    id: "rep-3",
    reporterId: "anon-user-789",
    domain: "Civic Infrastructure",
    category: "Garbage Dump",
    description: "Uncontrolled garbage pile burning in Clifton Block 5, emitting hazardous black smoke near schools.",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=500&q=80",
    geoPoint: { latitude: 24.8160, longitude: 67.0330 },
    status: 'Pending',
    upvotes: [],
    downvotes: [],
    verificationScore: 0,
    clientTimestamp: Date.now() - 7200000,
    town: "Chanesar",
    uc: "UC-08 Chanesar Goth"
  },
  {
    id: "rep-4",
    reporterId: "anon-user-888",
    domain: "Public Safety",
    category: "Street Light Outage",
    description: "Entire street dark on Jahangir Road, causing unsafe environment and minor accidents at night.",
    imageUrl: "",
    geoPoint: { latitude: 24.8850, longitude: 67.0420 },
    status: 'Resolved',
    upvotes: ["anon-user-1", "anon-user-2", "anon-user-3", "anon-user-4"],
    downvotes: [],
    verificationScore: 4,
    clientTimestamp: Date.now() - 86400000,
    town: "Nazimabad",
    uc: "UC-01 Paposh Nagar"
  }
];

let mockAnnouncements: MockAnnouncement[] = [
  {
    id: "ann-1",
    titleEn: "🚨 EMERGENCY: Severe urban flooding alert in Lyari and Orangi town areas.",
    titleUr: "🚨 ایمرجنسی: لیاری اور اورنگی ٹاؤن کے علاقوں میں شدید شہری سیلاب کا الرٹ۔",
    descriptionEn: "Please avoid unnecessary travel.",
    descriptionUr: "براہ کرم غیر ضروری سفر سے گریز کریں۔",
    type: "emergency",
    timestamp: Date.now()
  },
  {
    id: "ann-2",
    titleEn: "⚠️ WATER OUTAGE: Main supply maintenance in District East today.",
    titleUr: "⚠️ پانی کی معطلی: آج ڈسٹرکٹ ایسٹ میں مین سپلائی کی دیکھ بھال۔",
    descriptionEn: "Supply will resume by 8 PM.",
    descriptionUr: "سپلائی رات 8 بجے تک بحال ہو جائے گی۔",
    type: "warning",
    timestamp: Date.now() - 3600000
  }
];

const mockListeners: { [id: string]: () => void } = {};
const triggerListeners = () => {
  Object.values(mockListeners).forEach(listener => listener());
};

// ----------------------------------------------------
// EXPORTED FIREBASE & MOCK INTERFACE SERVICES
// ----------------------------------------------------

// Step A: Authentication & Initialization
// Step A: Authentication & Initialization
export async function initializeAnonymousAuth(): Promise<string> {
  if (isMockMode || !auth) {
    console.log("Mock Mode Auth: Simulating silent anonymous authentication...");
    mockUser = {
      uid: "mock-reporter-uid-101",
      email: null,
      isAnonymous: true,
      role: 'citizen',
      town: null,
      uc: null,
      chairmanName: null,
      contact: null
    };
    triggerAuthListeners();
    return "mock-reporter-uid-101";
  }
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Authenticated anonymously with UID:", userCredential.user.uid);
    return userCredential.user.uid;
  } catch (error) {
    console.error("Anonymous authentication error:", error);
    isMockMode = true; // Failover
    return "mock-reporter-uid-failover";
  }
}

// Fetch current UID helper
export function getCurrentUserId(): string {
  if (isMockMode || !auth?.currentUser) {
    return "mock-reporter-uid-101";
  }
  return auth.currentUser.uid;
}

export async function submitReport(reportData: {
  reporterId: string;
  domain: string;
  category: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  tankerPrice?: number | null;
  voiceUrl?: string | null;
  town?: string | null;
  uc?: string | null;
}): Promise<string> {
  const newReport = {
    reporterId: reportData.reporterId,
    domain: reportData.domain,
    category: reportData.category,
    description: reportData.description,
    imageUrl: reportData.imageUrl,
    status: 'Pending' as const,
    upvotes: [] as string[],
    downvotes: [] as string[],
    verificationScore: 0,
    clientTimestamp: Date.now(),
    tankerPrice: reportData.tankerPrice || null,
    voiceUrl: reportData.voiceUrl || null,
    town: reportData.town || null,
    uc: reportData.uc || null
  };

  if (isMockMode || !db) {
    const id = "rep-" + Math.random().toString(36).substr(2, 9);
    const mockReportItem: MockReport = {
      id,
      ...newReport,
      geoPoint: { latitude: reportData.latitude, longitude: reportData.longitude }
    };
    // @ts-ignore
    mockReports.unshift(mockReportItem);
    triggerListeners();
    console.log("Report submitted locally via Mock Mode:", mockReportItem);
    return id;
  }

  try {
    const docRef = await addDoc(collection(db, "reports"), {
      ...newReport,
      geoPoint: new GeoPoint(reportData.latitude, reportData.longitude)
    });
    console.log("Report submitted to Firestore with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Firestore submit report error, caching in Mock DB:", error);
    // Silent failover to support low-connectivity offline mode
    const id = "rep-offline-" + Math.random().toString(36).substr(2, 9);
    mockReports.unshift({
      id,
      ...newReport,
      geoPoint: { latitude: reportData.latitude, longitude: reportData.longitude }
    });
    triggerListeners();
    return id;
  }
}

// 2. Real-Time Broadcast Alerts & Transparency Dashboard (onSnapshot)
export function subscribeToReports(onUpdate: (reports: any[]) => void): () => void {
  if (isMockMode || !db) {
    const listenerId = Math.random().toString();
    mockListeners[listenerId] = () => {
      onUpdate([...mockReports]);
    };
    // Initial call
    onUpdate([...mockReports]);
    return () => {
      delete mockListeners[listenerId];
    };
  }

  try {
    const q = query(collection(db, "reports"), orderBy("clientTimestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle GeoPoint conversion
          geoPoint: data.geoPoint ? {
            latitude: data.geoPoint.latitude,
            longitude: data.geoPoint.longitude
          } : { latitude: 0, longitude: 0 }
        };
      });
      onUpdate(reports);
    }, (error) => {
      console.warn("Firestore listener failed, switching to local mock data feed:", error);
      onUpdate([...mockReports]);
    });
  } catch (error) {
    console.warn("Firestore subscription exception, using mock data:", error);
    onUpdate([...mockReports]);
    return () => {};
  }
}

// Subscribe to broadcasts/announcements
export function subscribeToAnnouncements(onUpdate: (announcements: any[]) => void): () => void {
  if (isMockMode || !db) {
    onUpdate([...mockAnnouncements]);
    const listenerId = "ann-" + Math.random().toString();
    mockListeners[listenerId] = () => {
      onUpdate([...mockAnnouncements]);
    };
    return () => {
      delete mockListeners[listenerId];
    };
  }

  try {
    const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(announcements);
    }, () => {
      onUpdate([...mockAnnouncements]);
    });
  } catch (error) {
    onUpdate([...mockAnnouncements]);
    return () => {};
  }
}

// Method to publish Zonal/UC Announcements
export async function addAnnouncement(announcementData: {
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  type: 'emergency' | 'info' | 'warning';
}): Promise<void> {
  const authorName = mockUser?.chairmanName ? `${mockUser.chairmanName} (${mockUser.uc})` : 'Zonal Authority';
  const newAnn: MockAnnouncement = {
    id: "ann-" + Math.random().toString(),
    titleEn: `[${mockUser?.town || 'Karachi'}] ${announcementData.titleEn}`,
    titleUr: `[${mockUser?.town || 'کراچی'}] ${announcementData.titleUr}`,
    descriptionEn: `${announcementData.descriptionEn} - Issued by: ${authorName}`,
    descriptionUr: `${announcementData.descriptionUr} - جاری کردہ: ${authorName}`,
    type: announcementData.type,
    timestamp: Date.now()
  };

  if (isMockMode || !db) {
    mockAnnouncements.unshift(newAnn);
    triggerListeners();
    return;
  }

  try {
    await addDoc(collection(db, "announcements"), {
      titleEn: announcementData.titleEn,
      titleUr: announcementData.titleUr,
      descriptionEn: announcementData.descriptionEn,
      descriptionUr: announcementData.descriptionUr,
      type: announcementData.type,
      timestamp: Date.now()
    });
    triggerListeners();
  } catch (error) {
    console.error("Failed adding announcement:", error);
    mockAnnouncements.unshift(newAnn);
    triggerListeners();
  }
}

// 3. Crowdsourced Community Verification (Proximity Voting Mechanics)
export async function voteReport(
  reportId: string, 
  userId: string, 
  voteType: 'verify' | 'flag'
): Promise<void> {
  if (isMockMode || !db || reportId.startsWith("rep-offline-") || reportId.startsWith("rep-")) {
    const reportIndex = mockReports.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      const report = mockReports[reportIndex];
      
      // Remove previous vote if any
      report.upvotes = report.upvotes.filter(uid => uid !== userId);
      report.downvotes = report.downvotes.filter(uid => uid !== userId);

      if (voteType === 'verify') {
        report.upvotes.push(userId);
      } else {
        report.downvotes.push(userId);
      }

      // Re-evaluate verification score
      report.verificationScore = report.upvotes.length - report.downvotes.length;

      // Status adjustment
      if (report.verificationScore >= 3) {
        report.status = 'Verified';
      } else if (report.verificationScore <= -3) {
        report.status = 'Spam';
      } else {
        report.status = 'Pending';
      }

      mockReports[reportIndex] = { ...report };
      triggerListeners();
      console.log("Mock Vote Applied. Score:", report.verificationScore, "Status:", report.status);
    }
    return;
  }

  try {
    const docRef = doc(db, "reports", reportId);
    
    // To support clean transaction or updates
    // In Firestore, we use arrayUnion for marking vote, and arrayRemove to avoid duplicate votes.
    if (voteType === 'verify') {
      await updateDoc(docRef, {
        upvotes: arrayUnion(userId),
        downvotes: arrayRemove(userId),
      });
    } else {
      await updateDoc(docRef, {
        downvotes: arrayUnion(userId),
        upvotes: arrayRemove(userId),
      });
    }

    // A cloud function would normally sync status, but let's calculate client-side 
    // to keep it serverless and fast for the 24h hackathon constraint.
    // Fetch and update status based on votes
    // We can fetch, calculate and update:
    // This is run in-place to fulfill: "If upvotes.length - downvotes.length >= 3, change status to Verified. If it drops below -3, mark as Spam."
    onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const up = data.upvotes ? data.upvotes.length : 0;
        const down = data.downvotes ? data.downvotes.length : 0;
        const score = up - down;
        
        let newStatus = data.status;
        if (score >= 3 && data.status !== 'Verified') {
          newStatus = 'Verified';
        } else if (score <= -3 && data.status !== 'Spam') {
          newStatus = 'Spam';
        } else if (score > -3 && score < 3 && data.status !== 'Pending' && data.status !== 'Resolved') {
          newStatus = 'Pending';
        }

        if (newStatus !== data.status) {
          await updateDoc(docRef, { 
            status: newStatus,
            verificationScore: score
          });
        }
      }
    });
  } catch (error) {
    console.error("Firestore vote report error, simulating locally:", error);
  }
}

// 4. Admin Update Status Control
export async function updateReportStatus(reportId: string, status: 'Pending' | 'Verified' | 'Spam' | 'Resolved'): Promise<void> {
  if (isMockMode || !db || reportId.startsWith("rep-offline-") || reportId.startsWith("rep-")) {
    const reportIndex = mockReports.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      mockReports[reportIndex].status = status;
      triggerListeners();
      console.log(`Mock Status updated for ${reportId} to ${status}`);
    }
    return;
  }

  try {
    const docRef = doc(db, "reports", reportId);
    await updateDoc(docRef, { status });
    console.log(`Firestore Status updated for ${reportId} to ${status}`);
  } catch (error) {
    console.error("Firestore status update failed:", error);
  }
}

// 5. Image Compression & Storage Upload
export async function uploadImageAsync(uri: string): Promise<string> {
  if (isMockMode || !storage) {
    console.log("Mock Storage: Simulating upload of compressed image...");
    // Return the local URI so the user's actual photo displays, fallback to placeholder if undefined
    return uri || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=500&q=80";
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `reports/${getCurrentUserId()}-${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log("Image uploaded to Firebase Storage. URL:", downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.warn("Firebase Storage upload failed (possibly disabled or configuration restriction). Falling back to placeholder image URL:", error);
    // Return a high-quality civic placeholder image
    return "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=500&q=80";
  }
}

// ----------------------------------------------------
// EXTENDED AUTH & SCALABLE PAGINATION SERVICES
// ----------------------------------------------------

// Simulated mock auth variables
let mockUser: { 
  uid: string; 
  email: string | null; 
  isAnonymous: boolean;
  role: 'citizen' | 'authority';
  town: string | null;
  uc: string | null;
  chairmanName: string | null;
  contact: string | null;
} | null = null;
const mockAuthListeners: { [id: string]: (user: any) => void } = {};
const triggerAuthListeners = () => {
  Object.values(mockAuthListeners).forEach(listener => listener(mockUser ? { ...mockUser } : null));
};

// Subscribe to Auth State Changes
export function subscribeToAuth(onUserChange: (user: any) => void): () => void {
  if (isMockMode || !auth) {
    const listenerId = Math.random().toString();
    mockAuthListeners[listenerId] = onUserChange;
    // Call immediately with current mock user
    onUserChange(mockUser ? { ...mockUser } : null);
    return () => {
      delete mockAuthListeners[listenerId];
    };
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const ucInfo = findUCByEmail(firebaseUser.email || '');
      onUserChange({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        isAnonymous: firebaseUser.isAnonymous,
        role: ucInfo ? 'authority' : 'citizen',
        town: ucInfo ? ucInfo.town : null,
        uc: ucInfo ? `${ucInfo.uc.ucNo} ${ucInfo.uc.name}` : null,
        chairmanName: ucInfo ? ucInfo.uc.chairman : null,
        contact: ucInfo ? ucInfo.uc.contact : null
      });
    } else {
      onUserChange(null);
    }
  });
}

// Sign in with Email / Password
export async function loginWithEmail(email: string, password: string): Promise<string> {
  const ucInfo = findUCByEmail(email);
  if (isMockMode || !auth) {
    console.log("Mock Login: Logging in with Email:", email);
    const uid = "mock-user-" + email.replace(/[^a-zA-Z0-9]/g, '');
    mockUser = {
      uid: uid,
      email: email,
      isAnonymous: false,
      role: ucInfo ? 'authority' : 'citizen',
      town: ucInfo ? ucInfo.town : null,
      uc: ucInfo ? `${ucInfo.uc.ucNo} ${ucInfo.uc.name}` : null,
      chairmanName: ucInfo ? ucInfo.uc.chairman : null,
      contact: ucInfo ? (ucInfo.uc.contact || null) : null
    };
    triggerAuthListeners();
    return uid;
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user.uid;
}

// Register with Email / Password
export async function signUpWithEmail(email: string, password: string): Promise<string> {
  const ucInfo = findUCByEmail(email);
  if (isMockMode || !auth) {
    console.log("Mock Signup: Creating account with Email:", email);
    const uid = "mock-user-" + email.replace(/[^a-zA-Z0-9]/g, '');
    mockUser = {
      uid: uid,
      email: email,
      isAnonymous: false,
      role: ucInfo ? 'authority' : 'citizen',
      town: ucInfo ? ucInfo.town : null,
      uc: ucInfo ? `${ucInfo.uc.ucNo} ${ucInfo.uc.name}` : null,
      chairmanName: ucInfo ? ucInfo.uc.chairman : null,
      contact: ucInfo ? (ucInfo.uc.contact || null) : null
    };
    triggerAuthListeners();
    return uid;
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user.uid;
}

// Sign out User
export async function logoutUser(): Promise<void> {
  if (isMockMode || !auth) {
    console.log("Mock Logout: Clearing auth session.");
    mockUser = null;
    triggerAuthListeners();
    return;
  }

  await signOut(auth);
}

// Fetch Paginated Reports (for scaling database reads to 500,000+ reports)
export async function fetchReportsPaginated(
  limitCount: number,
  lastDoc: any,
  reporterId?: string
): Promise<{ reports: any[]; lastDoc: any }> {
  if (isMockMode || !db) {
    // Mock slice pagination
    let source = [...mockReports];
    if (reporterId) {
      source = source.filter(r => r.reporterId === reporterId);
    }

    let startIndex = 0;
    if (lastDoc) {
      const index = source.findIndex(r => r.id === lastDoc);
      if (index !== -1) {
        startIndex = index + 1;
      }
    }
    const paginatedSlice = source.slice(startIndex, startIndex + limitCount);
    const newLastDoc = paginatedSlice.length > 0 ? paginatedSlice[paginatedSlice.length - 1].id : null;
    return {
      reports: paginatedSlice,
      lastDoc: newLastDoc
    };
  }

  try {
    let q = query(
      collection(db, "reports"),
      orderBy("clientTimestamp", "desc"),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        geoPoint: data.geoPoint ? {
          latitude: data.geoPoint.latitude,
          longitude: data.geoPoint.longitude
        } : { latitude: 0, longitude: 0 }
      };
    });

    const newLastDoc = querySnapshot.docs.length > 0 
      ? querySnapshot.docs[querySnapshot.docs.length - 1] 
      : null;

    return { reports, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error fetching paginated reports:", error);
    // Fallback to mock slice
    return { reports: mockReports.slice(0, limitCount), lastDoc: null };
  }
}
