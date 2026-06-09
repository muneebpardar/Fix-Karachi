# 🇵🇰 Fix Karachi: Smart Civic Action & Transparency Platform

**Fix Karachi** is a cross-platform (Web, iOS, Android) civic empowerment application designed to bridge the gap between the citizens of Karachi and their Zonal Authorities (Union Council Chairmen). Built during the **EFEST 2026 Hackathon**, the platform tackles the city's unique infrastructural challenges through real-time data, offline-first caching, and strict jurisdictional transparency.

---

## 🛠️ Technology Stack & Libraries

### Core Frameworks
*   **Expo SDK 56 & React Native (0.85)**: Provides the foundation for building a truly universal, high-performance hybrid mobile and web application from a single codebase.
*   **Expo Router**: Used for file-based routing and deep-linking, allowing seamless navigation across tabs (Dashboard, Report, Verify, Map Analytics).

### Cloud & Database
*   **Firebase SDK (12.14.0)**: 
    *   *Firestore*: Used for the real-time `onSnapshot` global transparency feed.
    *   *Authentication*: Provides both anonymous citizen login and secure email-based Zonal Admin portals.

### Mapping & Geolocation
*   **Leaflet JS & react-native-webview**: We explicitly bypassed native Google Maps SDK API Key constraints (which often crash or render blank on Expo Go) by injecting a unified OpenStreetMap Leaflet HTML instance into a cross-platform WebView. This guarantees 100% feature parity across iOS, Android, and Web browsers.
*   **expo-location**: For extracting real-time lat/lng coordinates during complaint generation.

### Media & Device Storage
*   **expo-audio**: Modern audio engine used to play back low-bandwidth voice notes submitted by citizens. (Replaced the deprecated `expo-av` library).
*   **expo-image-picker**: To capture live photo evidence.
*   **@react-native-async-storage/async-storage**: Powers the robust offline caching layer.

---

## 🚀 Key Engineering Marvels & Architecture

### 1. Offline-First Caching & Load Balancing (`useCachedSync.js`)
Karachi suffers from frequent cellular dead-zones and network congestion. To combat this, we engineered a custom `useCachedSync` hook:
*   **Network Polling**: Constantly pings lightweight endpoints to monitor connection state.
*   **Local Queuing**: If a user is offline, complaints (with images/audio) are serialized and pushed to `AsyncStorage`.
*   **BLE Mesh Sync Simulation**: The system simulates a localized Bluetooth Low Energy (BLE) mesh network that trades complaint IDs with nearby offline peers to propagate data across the city without cellular networks.
*   **Load Balanced Sync**: Upon reconnecting to the internet, the queue is incrementally flushed to Firebase, preventing sudden traffic spikes (load balancing) to the cloud infrastructure.

### 2. Strict Jurisdictional Security & Zonal Admin Console
The app imports authentic organizational data mapping **7 TMC Zones** to their respective **Union Councils (UCs)** and Chairmen.
*   **Automated Fallback Registration**: During the hackathon demo, if an admin selects a specific UC, the app automatically auto-registers the mock credentials on the fly via Firebase Authentication.
*   **Heatmap Locks**: An admin can view the heatmap for the entire city, but the `AdminMapScreen` enforces a strict jurisdictional lock: **They can only physically press the "Resolve" button on complaints matching their specific UC boundary.**

### 3. Universal Web & Native UI Unification
*   **Dynamic Language Engine**: Supports immediate toggle between English and Urdu. The UI dynamically shifts from LTR to RTL flexbox directions using custom localization hooks.
*   **Civic Duty Trust Score**: A gamified algorithmic score that tracks a citizen's reporting accuracy to filter out spam and prioritize high-value infrastructural alerts (like the Tanker Price Mafia flag).

---

## 🏃‍♂️ Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Universal App:**
   ```bash
   npm run start
   ```
   *Press `w` for the Web Interface, or scan the QR code using Expo Go on your physical Android/iOS device.*
