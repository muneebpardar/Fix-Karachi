import React, { useState, useEffect, createElement } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { useAudioPlayer, AudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/services/localization';
import { subscribeToReports, updateReportStatus, subscribeToAuth } from '@/services/firebase';
import { KARACHI_CENTER } from '@/services/location';

import { WebView } from 'react-native-webview';

export default function AdminMapScreen() {
  const { t, flexDirectionStyle, textAlignStyle, alignItemsStyle, isUrdu } = useLanguage();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const playVoiceNote = async (reportId) => {
    if (playingAudioId === reportId) return;
    try {
      setPlayingAudioId(reportId);
      // Play realistic mock audio for hackathon
      const player = new AudioPlayer('https://actions.google.com/sounds/v1/human_voices/human_chatter.ogg');
      await player.play();
      
      setTimeout(() => {
        setPlayingAudioId(null);
        try {
          player.pause();
        } catch(e) {}
      }, 4000);
    } catch (e) {
      console.warn("Audio play failed:", e);
      setPlayingAudioId(null);
    }
  };

  useEffect(() => {
    const unsubAuth = subscribeToAuth(setCurrentUser);
    setLoading(true);
    const unsubscribe = subscribeToReports((updatedReports) => {
      // Filter out spam records
      const active = updatedReports.filter(r => r.status !== 'Spam');
      setReports(active);
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, []);

  // Keep details panel fresh when reports update, without re-subscribing
  useEffect(() => {
    if (selectedReport) {
      const fresh = reports.find(r => r.id === selectedReport.id);
      if (fresh && (fresh.status !== selectedReport.status || fresh.verificationScore !== selectedReport.verificationScore)) {
        setSelectedReport(fresh);
      }
    }
  }, [reports, selectedReport]);

  const handleResolve = async (reportId) => {
    setUpdatingStatus(true);
    try {
      await updateReportStatus(reportId, 'Resolved');
    } catch (error) {
      console.error("Admin resolve failed:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getMarkerColor = (report) => {
    if (report.status === 'Resolved') return '#065F46'; // Civic Green
    if (report.status === 'Verified') return '#1D6874';  // Coastal Teal
    
    // Check if price anomaly is flagged or category is high priority
    if (report.tankerPrice && report.tankerPrice > 3000) return '#A94442'; // Hot warning
    if (report.domain === 'Public Safety') return '#A94442'; // Emergency red
    
    return '#D97706'; // Pending standard - Amber/Terracotta yellow
  };

  const getPriorityLabel = (report) => {
    if (report.status === 'Resolved') return isUrdu ? "حل شدہ" : "Resolved";
    if (report.status === 'Verified') return isUrdu ? "تصدیق شدہ (میانہ ترجیح)" : "Verified (Medium Priority)";
    if (report.tankerPrice && report.tankerPrice > 3000) return isUrdu ? "انتہائی ہنگامی (قیمت مافیا)" : "CRITICAL (Tanker Mafia Anomaly)";
    if (report.domain === 'Public Safety') return isUrdu ? "ہنگامی (عوامی حفاظت)" : "CRITICAL (Public Safety Alert)";
    return isUrdu ? "جاری (عام ترجیح)" : "Pending (Normal Priority)";
  };

  const domains = ['All', 'Civic Infrastructure', 'Utilities', 'Public Safety', 'Transport'];

  const filteredReports = selectedDomain === 'All' 
    ? reports 
    : reports.filter(r => r.domain === selectedDomain);

  // Unified interactive map for Web and Mobile using Leaflet
  const getMapHtmlContent = () => {
    const markersHtml = filteredReports.map(rep => {
      const lat = rep.geoPoint?.latitude || rep.latitude || KARACHI_CENTER.latitude;
      const lng = rep.geoPoint?.longitude || rep.longitude || KARACHI_CENTER.longitude;
      const color = getMarkerColor(rep);
      const title = (rep.category || 'Complaint').replace(/'/g, "\\'");
      const status = (rep.status || 'Pending').replace(/'/g, "\\'");
      return `L.circleMarker([${lat}, ${lng}], { color: '${color}', radius: 8, fillOpacity: 0.8 }).addTo(map).bindPopup('<b>${title}</b><br>${status}');`;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #0F172A; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${KARACHI_CENTER.latitude}, ${KARACHI_CENTER.longitude}], 11);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          }).addTo(map);
          ${markersHtml}
        </script>
      </body>
      </html>
    `;
  };

  const renderUnifiedMap = () => {
    const htmlContent = getMapHtmlContent();
    if (Platform.OS === 'web') {
      return createElement('iframe', {
        style: { flex: 1, width: '100%', height: '100%', border: 'none' },
        srcDoc: htmlContent,
        title: 'Admin Heatmap'
      });
    } else {
      return (
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={StyleSheet.absoluteFillObject}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Dynamic Header Block */}
      <View style={styles.header}>
        <View style={styles.headerBorder}>
          <Text style={styles.headerTitle}>
            {isUrdu ? "حکام ہیٹ میپ انالیٹکس" : "AUTHORITY HEATMAP ANALYTICS"}
          </Text>
        </View>
      </View>

      {/* Domain Filters scrollbar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {domains.map((dom) => (
            <TouchableOpacity
              key={dom}
              style={[
                styles.filterPill,
                selectedDomain === dom && styles.filterPillActive
              ]}
              onPress={() => {
                setSelectedDomain(dom);
                setSelectedReport(null);
              }}
            >
              <Text style={[
                styles.filterText,
                selectedDomain === dom && styles.filterTextActive
              ]}>
                {dom === 'All' ? (isUrdu ? "تمام شکایتیں" : "All Fields") : dom}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map Content */}
      <View style={styles.mapContainer}>
        {renderUnifiedMap()}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#065F46" />
            <Text style={styles.loadingText}>{isUrdu ? "انالیٹکس ڈیٹا لوڈ ہو رہا ہے..." : "Calculating Heatmap Priorities..."}</Text>
          </View>
        )}

        {/* Priority Color Legend Overlay */}
        <View style={styles.legendOverlay}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#A94442' }]} />
            <Text style={styles.legendLabel}>{isUrdu ? "سنگین مسائل / مافیا" : "Critical Warning"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#1D6874' }]} />
            <Text style={styles.legendLabel}>{isUrdu ? "تصدیق شدہ" : "Verified Issue"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#065F46' }]} />
            <Text style={styles.legendLabel}>{isUrdu ? "حل شدہ" : "Resolved"}</Text>
          </View>
        </View>

        {/* Selected Complaint Detail Overlay Drawer */}
        {selectedReport && (
          <View style={styles.detailDrawer}>
            
            {/* Hala geometric header */}
            <View style={styles.drawerHalaDivider} />

            <View style={[styles.drawerHeader, { flexDirection: flexDirectionStyle }]}>
              <View style={{ flex: 1, alignItems: alignItemsStyle }}>
                <Text style={styles.drawerCategory}>{selectedReport.category}</Text>
                <Text style={[styles.priorityTag, { color: getMarkerColor(selectedReport) }]}>
                  {getPriorityLabel(selectedReport)}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedReport(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedReport.imageUrl ? (
              <Image source={{ uri: selectedReport.imageUrl }} style={styles.drawerImage} resizeMode="cover" />
            ) : null}

            {/* Price Tracker Display inside drawer */}
            {selectedReport.tankerPrice ? (
              <View style={styles.anomalyBox}>
                <Text style={styles.anomalyBoxTitle}>💧 Water Tanker Fair Cost Audit:</Text>
                <Text style={styles.anomalyBoxVal}>{selectedReport.tankerPrice} PKR</Text>
              </View>
            ) : null}

            {/* Localized Voice Note Playback Button in Admin Drawer */}
            {selectedReport.voiceUrl ? (
              <TouchableOpacity 
                style={[styles.anomalyBox, { flexDirection: flexDirectionStyle, backgroundColor: 'rgba(29, 104, 116, 0.1)', borderColor: '#1D6874' }]}
                onPress={() => playVoiceNote(selectedReport.id)}
              >
                <Text style={{ fontSize: 16 }}>{playingAudioId === selectedReport.id ? '🔊' : '🎤'}</Text>
                <Text style={[styles.anomalyBoxVal, { marginLeft: 8, color: '#1D6874' }]}>
                  {playingAudioId === selectedReport.id 
                    ? (isUrdu ? "آڈیو چل رہی ہے..." : "Playing audio memo...") 
                    : (isUrdu ? "صوتی شکایت سنیں" : "Play attached voice complaint")}
                </Text>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.drawerDesc, { textAlign: textAlignStyle }]}>{selectedReport.description}</Text>

            <View style={[styles.drawerMeta, { flexDirection: flexDirectionStyle }]}>
              <Text style={styles.drawerMetaText}>
                📍 LAT: {(selectedReport.geoPoint?.latitude || selectedReport.latitude || 24.8).toFixed(4)} | LNG: {(selectedReport.geoPoint?.longitude || selectedReport.longitude || 67.0).toFixed(4)}
              </Text>
              <Text style={styles.drawerMetaText}>
                🗳️ {isUrdu ? "اتفاق رائے:" : "Consensus Score:"} {selectedReport.verificationScore ?? 0}
              </Text>
            </View>

            {/* Admin Action Button with Jurisdictional Locks */}
            {selectedReport.status !== 'Resolved' && (
              <>
                {currentUser?.role === 'authority' && currentUser?.uc === selectedReport.uc ? (
                  <TouchableOpacity 
                    style={styles.resolveBtn} 
                    onPress={() => handleResolve(selectedReport.id)}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.resolveBtnText}>
                        {isUrdu ? "مسئلہ حل کے طور پر نشان زد کریں" : "MARK AS RESOLVED"}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.resolveBtn, { backgroundColor: '#A94442', opacity: 0.9 }]}>
                    <Text style={[styles.resolveBtnText, { fontSize: 13, textAlign: 'center' }]}>
                      🔒 {isUrdu 
                        ? `صرف ${selectedReport.uc || 'متعلقہ'} ایڈمن ہی اسے حل کر سکتا ہے`
                        : `LOCKED: Belongs to ${selectedReport.uc || 'Another'} Jurisdiction`}
                    </Text>
                  </View>
                )}
              </>
            )}

          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DFD1A5', // Frere Hall Sandstone Yellow
  },
  header: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#DFD1A5',
  },
  headerBorder: {
    borderWidth: 2,
    borderColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E6DAB2',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  filterBar: {
    paddingVertical: 8,
    backgroundColor: '#DFD1A5',
    borderBottomWidth: 2,
    borderColor: '#0F172A',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E6DAB2',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#1D6874',
  },
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMapGrid: {
    flex: 1,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  districtLabel: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(223, 209, 165, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  districtText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  oceanIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#0A0F1D',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderColor: '#0F172A',
  },
  oceanText: {
    color: '#1E293B',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  webPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -7,
    marginTop: -7,
  },
  webPinPulse: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    opacity: 0.2,
    marginLeft: -13,
    marginTop: -13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  legendOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(223, 209, 165, 0.95)',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  detailDrawer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#DFD1A5',
    borderWidth: 3,
    borderColor: '#0F172A',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  drawerHalaDivider: {
    height: 4,
    backgroundColor: '#1D6874',
    marginBottom: 12,
  },
  drawerHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  drawerCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  priorityTag: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  drawerImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginVertical: 10,
  },
  anomalyBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(169, 68, 66, 0.1)',
    borderWidth: 1,
    borderColor: '#A94442',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  anomalyBoxTitle: {
    color: '#A94442',
    fontSize: 11,
    fontWeight: 'bold',
  },
  anomalyBoxVal: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  drawerDesc: {
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 16,
    marginVertical: 4,
  },
  drawerMeta: {
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.1)',
  },
  drawerMetaText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: 'bold',
  },
  resolveBtn: {
    backgroundColor: '#065F46',
    borderWidth: 2,
    borderColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#DFD1A5"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#0F172A"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1D6874"
      }
    ]
  }
];
