import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isMockMode } from '@/config/firebase';
import { collection, addDoc, GeoPoint } from 'firebase/firestore';
import { submitReport } from '@/services/firebase';

const OFFLINE_QUEUE_KEY = '@fix_karachi_offline_queue';
const MESH_SYNCED_KEY = '@fix_karachi_mesh_synced_ids';

export default function useCachedSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState([]);
  const [meshIds, setMeshIds] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [blePeersCount, setBlePeersCount] = useState(0);

  // 1. Connection Monitoring Engine (Hybrid Web/Native Ping)
  useEffect(() => {
    let intervalId;

    const checkConnectivity = async () => {
      if (Platform.OS === 'web') {
        setIsOnline(navigator.onLine);
        return;
      }
      
      // Native fetch ping to google status endpoint (highly reliable, no native libraries required)
      try {
        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          headers: { 'Cache-Control': 'no-cache' }
        });
        setIsOnline(response.status === 204 || response.ok);
      } catch (err) {
        setIsOnline(false);
      }
    };

    // Run immediately and setup 8-second heartbeat check
    checkConnectivity();
    intervalId = setInterval(checkConnectivity, 8000);

    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => clearInterval(intervalId);
  }, []);

  // 2. Load Persisted Queue & Mesh Data from AsyncStorage
  const loadLocalCache = useCallback(async () => {
    try {
      const storedQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (storedQueue) {
        setQueue(JSON.parse(storedQueue));
      }
      const storedMesh = await AsyncStorage.getItem(MESH_SYNCED_KEY);
      if (storedMesh) {
        setMeshIds(JSON.parse(storedMesh));
      }
    } catch (e) {
      console.warn("AsyncStorage reading failed:", e);
    }
  }, []);

  useEffect(() => {
    loadLocalCache();
  }, [loadLocalCache]);

  // 3. Mock BLE Localized Mesh Sync Simulator
  // Simulates discovering nearby peer devices, exchanging report IDs offline, and saving peer reports
  useEffect(() => {
    if (!isOnline) {
      // Simulate discovering 1-4 offline peers when network is down
      const peerCount = Math.floor(Math.random() * 4) + 1;
      setBlePeersCount(peerCount);

      // Periodically simulate receiving report IDs from nearby peers via Bluetooth LE Mesh
      const meshInterval = setInterval(async () => {
        if (queue.length > 0) {
          const simulatedPeerReportId = `ble-peer-rep-${Math.random().toString(36).substr(2, 9)}`;
          
          setMeshIds(prev => {
            if (prev.includes(simulatedPeerReportId)) return prev;
            const updated = [...prev, simulatedPeerReportId];
            AsyncStorage.setItem(MESH_SYNCED_KEY, JSON.stringify(updated));
            return updated;
          });

          // Inject a simulated nearby complaint received via mesh
          const meshReport = {
            id: simulatedPeerReportId,
            reporterId: 'ble-mesh-peer-device',
            domain: 'Utilities',
            category: 'Water Leakage',
            description: `[BLE Mesh Sync] Severe water line rupture reported near saddar. Price anomaly: 0 PKR.`,
            imageUrl: '',
            latitude: 24.8607 + (Math.random() - 0.5) * 0.05,
            longitude: 67.0011 + (Math.random() - 0.5) * 0.05,
            status: 'Pending',
            upvotes: [],
            downvotes: [],
            verificationScore: 0,
            clientTimestamp: Date.now(),
            isMeshReceived: true
          };

          setQueue(prev => {
            const updatedQueue = [...prev, meshReport];
            AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
            return updatedQueue;
          });
        }
      }, 15000); // Exchange mesh data every 15 seconds while offline

      return () => clearInterval(meshInterval);
    } else {
      setBlePeersCount(0);
    }
  }, [isOnline, queue.length]);

  // 4. Add Report to Offline Persistent Queue
  const addToOfflineQueue = useCallback(async (report) => {
    try {
      const newReport = {
        ...report,
        id: report.id || `offline-rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        clientTimestamp: Date.now()
      };
      
      const updatedQueue = [...queue, newReport];
      setQueue(updatedQueue);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log("Report successfully queued in persistent local storage.");
      return newReport.id;
    } catch (e) {
      console.error("Failed to persist queued report:", e);
      throw e;
    }
  }, [queue]);

  // 5. Explicit Synchronization Engine
  const syncOfflineQueue = useCallback(async () => {
    if (syncing || queue.length === 0 || !isOnline) return;
    setSyncing(true);

    const reportsToSync = [...queue];
    const failedToSync = [];

    console.log(`Starting synchronization of ${reportsToSync.length} offline complaints...`);

    for (const report of reportsToSync) {
      try {
        await submitReport({
          reporterId: report.reporterId,
          domain: report.domain,
          category: report.category,
          description: report.description,
          imageUrl: report.imageUrl || '',
          latitude: report.latitude || 24.8607,
          longitude: report.longitude || 67.0011,
          tankerPrice: report.tankerPrice || null,
          voiceUrl: report.voiceUrl || null,
          town: report.town || null,
          uc: report.uc || null
        });
      } catch (err) {
        console.warn(`Sync failed for report ${report.id}, retaining in queue:`, err);
        failedToSync.push(report);
      }
    }

    try {
      setQueue(failedToSync);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedToSync));
      
      if (failedToSync.length === 0) {
        // Successfully synced all mesh IDs
        setMeshIds([]);
        await AsyncStorage.removeItem(MESH_SYNCED_KEY);
      }
    } catch (e) {
      console.error("Failed saving sync resolution status:", e);
    } finally {
      setSyncing(false);
      console.log("Offline sync transaction complete.");
    }
  }, [queue, isOnline, syncing]);

  // Auto-sync when transitioning from offline to online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline, queue.length, syncOfflineQueue]);

  return {
    isOnline,
    offlineQueueSize: queue.length,
    blePeersCount,
    meshIdsCount: meshIds.length,
    addToOfflineQueue,
    syncOfflineQueue,
    syncing
  };
}
