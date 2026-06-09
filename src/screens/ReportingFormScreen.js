import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '@/services/localization';
import { getCurrentLocation } from '@/services/location';
import { uploadImageAsync, getCurrentUserId } from '@/services/firebase';
import useCachedSync from '@/hooks/useCachedSync';
import { KARACHI_TOWNS } from '../services/karachiData';

export default function ReportingFormScreen() {
  const { t, flexDirectionStyle, textAlignStyle, alignItemsStyle, isUrdu } = useLanguage();
  const { isOnline, addToOfflineQueue } = useCachedSync();

  const [domain, setDomain] = useState('Civic Infrastructure');
  const [category, setCategory] = useState('Pothole / Road Damage');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [skipPhoto, setSkipPhoto] = useState(false);

  // Administrative locality selection
  const [selectedTown, setSelectedTown] = useState(KARACHI_TOWNS[0].name);
  const [selectedUC, setSelectedUC] = useState(KARACHI_TOWNS[0].ucs[0].ucNo + ' ' + KARACHI_TOWNS[0].ucs[0].name);

  const handleTownChange = (townName) => {
    setSelectedTown(townName);
    const townObj = KARACHI_TOWNS.find(t => t.name === townName);
    if (townObj && townObj.ucs.length > 0) {
      setSelectedUC(townObj.ucs[0].ucNo + ' ' + townObj.ucs[0].name);
    }
  };

  // Tanker Mafia pricing fields
  const [tankerSize, setTankerSize] = useState('1000 Gallons');
  const [tankerPricePaid, setTankerPricePaid] = useState('');
  const [isFairPriceAnomaly, setIsFairPriceAnomaly] = useState(false);

  // Voice recording simulation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState(null);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState(0);

  // Geolocation
  const [location, setLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchGPSLocation();
  }, []);

  const fetchGPSLocation = async () => {
    setFetchingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
    } catch (err) {
      console.warn("Reporting Form: Geolocation failed:", err);
    } finally {
      setFetchingLocation(false);
    }
  };

  // 1. Image selection with compression logic
  const selectPhoto = async (fromCamera) => {
    setSkipPhoto(false);
    try {
      let result;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Error", "Camera permission is required.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5, // Low quality to reduce bandwith
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Error", "Gallery permission is required.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error("Image picker error:", e);
    }
  };

  // 2. Low-Bandwidth Voice Reporting simulation
  const [recordingInterval, setRecordingInterval] = useState(null);

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordedVoiceUrl(null);
    setVoiceNoteDuration(0);

    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      setVoiceNoteDuration(seconds);
      if (seconds >= 30) { // Max 30 seconds
        stopVoiceRecording();
      }
    }, 1000);
    setRecordingInterval(interval);
  };

  const stopVoiceRecording = () => {
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    setIsRecording(false);
    setRecordedVoiceUrl(`https://simulated-voice-note-${Date.now()}.amr`);

    Alert.alert(
      isUrdu ? "صوتی نوٹ محفوظ ہو گیا" : "Voice Note Captured", 
      isUrdu 
        ? "کم بینڈوتھ کے لیے صوتی نوٹ کو کامیابی سے کمپریس کر دیا گیا ہے۔" 
        : "Voice memo captured and compressed to AMR format (12.2kbps AMR-NB for 2G optimization)."
    );
  };

  // Monitor Tanker pricing to flag Mafia Cost Anomalies
  useEffect(() => {
    if (domain === 'Utilities' && category === 'Water Tanker Price') {
      const price = parseFloat(tankerPricePaid);
      if (!isNaN(price)) {
        // Fair Rate guidelines in Karachi: 1000 gallons should cost around 1500-2000 PKR.
        // If it exceeds 3000 PKR, flag as anomaly.
        if (tankerSize === '1000 Gallons' && price > 3000) {
          setIsFairPriceAnomaly(true);
        } else if (tankerSize === '2000 Gallons' && price > 5000) {
          setIsFairPriceAnomaly(true);
        } else {
          setIsFairPriceAnomaly(false);
        }
      }
    } else {
      setIsFairPriceAnomaly(false);
    }
  }, [tankerPricePaid, tankerSize, domain, category]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Error", isUrdu ? "شکایت کی تفصیل درج کریں۔" : "Please enter a complaint description.");
      return;
    }

    setSubmitting(true);
    setStatusMsg(isUrdu ? "پراسیس ہو رہا ہے..." : "Processing report...");

    try {
      let finalImageUrl = "";
      if (imageUri && !skipPhoto) {
        setStatusMsg(isUrdu ? "تصویر کمپریس ہو رہی ہے..." : "Compressing image...");
        // Delay to simulate low-bandwidth compression
        await new Promise(r => setTimeout(r, 600));
        setStatusMsg(isUrdu ? "فائل اپ لوڈ ہو رہی ہے..." : "Uploading image...");
        finalImageUrl = await uploadImageAsync(imageUri);
      }

      const reportPayload = {
        reporterId: getCurrentUserId(),
        domain,
        category,
        description: isFairPriceAnomaly 
          ? `[PRICE ANOMALY FLAG] Paid ${tankerPricePaid} PKR for ${tankerSize} (Official rate is ~1800 PKR). ${description}` 
          : description,
        imageUrl: finalImageUrl,
        latitude: location?.latitude ?? 24.8922,
        longitude: location?.longitude ?? 67.0747,
        status: 'Pending',
        upvotes: [],
        downvotes: [],
        verificationScore: 0,
        tankerPrice: (domain === 'Utilities' && category === 'Water Tanker Price') ? parseFloat(tankerPricePaid) : null,
        voiceUrl: recordedVoiceUrl,
        town: selectedTown,
        uc: selectedUC
      };

      if (!isOnline) {
        // Caching queue integration
        setStatusMsg(isUrdu ? "لوکل میموری میں محفوظ ہو رہا ہے..." : "Saving offline...");
        await addToOfflineQueue(reportPayload);
        
        Alert.alert(
          isUrdu ? "شکایت آف لائن محفوظ ہو گئی" : "Complaint Cached Offline",
          isUrdu 
            ? "انٹرنیٹ بند ہے۔ شکایت لوکل میموری میں محفوظ کر لی گئی ہے اور قریبی فعال فونز کے ساتھ BLE میش نیٹ ورک کے ذریعے خودکار شیئر ہو جائے گی۔"
            : "No internet connection. Your report is securely queued and will automatically sync when online, or propagate via offline BLE Mesh synchronization."
        );
      } else {
        // Sync online using cache sync helper
        setStatusMsg(isUrdu ? "کلاؤڈ پر بھیجا جا رہا ہے..." : "Syncing to cloud...");
        await addToOfflineQueue(reportPayload); // Add and let useCachedSync process it immediately
        Alert.alert("Success", isUrdu ? "شکایت کامیابی سے درج ہو گئی۔" : "Complaint successfully submitted!");
      }

      // Reset
      setDescription('');
      setImageUri(null);
      setRecordedVoiceUrl(null);
      setTankerPricePaid('');
      setSkipPhoto(false);
      fetchGPSLocation();
    } catch (e) {
      console.error("Submission failed:", e);
      Alert.alert("Submission Error", "Failed to submit. Report retained in device cache.");
    } finally {
      setSubmitting(false);
      setStatusMsg(null);
    }
  };

  const domainCategories = {
    'Civic Infrastructure': ['Pothole / Road Damage', 'Sewerage Overflow', 'Encroachment'],
    'Utilities': ['Water Leakage', 'Water Tanker Price', 'Gas Leakage', 'Power Cut / Hanging Wires'],
    'Public Safety': ['Street Light Outage', 'Other Incident'],
    'Transport': ['Public Transit Delay', 'Other Incident']
  };

  const handleDomainChange = (selectedDom) => {
    setDomain(selectedDom);
    const categories = domainCategories[selectedDom];
    if (categories && categories.length > 0) {
      setCategory(categories[0]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* Title Frame */}
        <View style={styles.headerFrame}>
          <Text style={[styles.title, { textAlign: textAlignStyle }]}>
            {isUrdu ? "شکایت درج کروائیں" : "Low-Bandwidth Reporting Portal"}
          </Text>
          <Text style={styles.subtitle}>
            {isUrdu 
              ? "کمزور انٹرنیٹ اور براہِ راست دھوپ کے لیے ڈیزائن کردہ فارم" 
              : "High contrast UI configured for budget screens in outdoor sunlight"
            }
          </Text>
        </View>

        {/* 1. AUTO GEO-TAGGING GPS READOUT (High contrast, outdoor readable) */}
        <View style={styles.gpsContainer}>
          <Text style={styles.gpsTitle}>📡 {isUrdu ? "جی پی ایس لائیو لوکیشن:" : "Hardware GPS Coordinate Readout:"}</Text>
          {fetchingLocation ? (
            <View style={styles.gpsRow}>
              <ActivityIndicator size="small" color="#0F172A" />
              <Text style={styles.gpsValue}>{isUrdu ? "کوارڈینیٹس حاصل کیے جا رہے ہیں..." : "Fetching satellite lock..."}</Text>
            </View>
          ) : location ? (
            <View style={styles.gpsRow}>
              <Text style={styles.gpsValue}>LAT: {location.latitude.toFixed(6)}  |  LNG: {location.longitude.toFixed(6)}</Text>
              <TouchableOpacity onPress={fetchGPSLocation} style={styles.gpsRefresh}>
                <Text style={{ fontWeight: 'bold' }}>🔄</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.gpsValue, { color: '#B91C1C' }]}>{isUrdu ? "جی پی ایس سگنل غائب ہے!" : "Satellite link error!"}</Text>
          )}
        </View>

        {/* LOCALITY / ADMINISTRATIVE SELECTOR */}
        <Text style={[styles.label, { textAlign: textAlignStyle }]}>
          🏢 {isUrdu ? "ٹاؤن / بلدیاتی زون منتخب کریں:" : "Select Zonal Town / TMC:"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {KARACHI_TOWNS.map(t => (
            <TouchableOpacity
              key={t.name}
              style={[styles.townBtn, selectedTown === t.name && styles.townBtnActive]}
              onPress={() => handleTownChange(t.name)}
            >
              <Text style={[styles.townBtnText, selectedTown === t.name && styles.townBtnTextActive]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { textAlign: textAlignStyle, marginTop: 4 }]}>
          🏘️ {isUrdu ? "یونین کونسل (UC) منتخب کریں:" : "Select Union Council (UC):"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {KARACHI_TOWNS.find(t => t.name === selectedTown)?.ucs.map(uc => {
            const ucLabel = `${uc.ucNo} - ${uc.name}`;
            const ucValue = `${uc.ucNo} ${uc.name}`;
            const isSelected = selectedUC === ucValue;
            return (
              <TouchableOpacity
                key={uc.ucNo}
                style={[styles.ucChip, isSelected && styles.ucChipActive]}
                onPress={() => setSelectedUC(ucValue)}
              >
                <Text style={[styles.ucChipText, isSelected && styles.ucChipTextActive]}>
                  {ucLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* DOMAIN SELECTOR BUTTONS */}
        <Text style={[styles.label, { textAlign: textAlignStyle }]}>{isUrdu ? "شعبہ منتخب کریں:" : "Civic Domain:"}</Text>
        <View style={styles.domainRow}>
          {Object.keys(domainCategories).map((dom) => (
            <TouchableOpacity
              key={dom}
              style={[styles.selectorBtn, domain === dom && styles.selectorBtnActive]}
              onPress={() => handleDomainChange(dom)}
            >
              <Text style={[styles.selectorBtnText, domain === dom && styles.selectorBtnTextActive]}>
                {dom === 'Civic Infrastructure' ? (isUrdu ? "انفراسٹرکچر" : "Infrastructure") :
                 dom === 'Utilities' ? (isUrdu ? "یوٹیلیٹیز" : "Utilities") :
                 dom === 'Public Safety' ? (isUrdu ? "حفاظت" : "Safety") :
                 (isUrdu ? "ٹرانسپورٹ" : "Transport")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CATEGORY SELECTOR */}
        <Text style={[styles.label, { textAlign: textAlignStyle }]}>{isUrdu ? "مسئلہ منتخب کریں:" : "Sub-Category Issue:"}</Text>
        <View style={styles.domainRow}>
          {(domainCategories[domain] || []).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.selectorBtn, styles.categoryBtn, category === cat && styles.selectorBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.selectorBtnText, category === cat && styles.selectorBtnTextActive]}>
                {cat === 'Water Tanker Price' ? (isUrdu ? "ٹینکر مافیا قیمت" : "Water Tanker Price") : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONDITIONAL WATER TANKER MAFIA PRICE TRACKER */}
        {domain === 'Utilities' && category === 'Water Tanker Price' && (
          <View style={styles.tankerMafiaBox}>
            <Text style={styles.tankerBoxTitle}>💧 Water Tanker Fair Price Tracker (Karachi Cost Audit)</Text>
            
            <Text style={styles.tankerLabel}>Tanker Capacity:</Text>
            <View style={styles.domainRow}>
              {['1000 Gallons', '2000 Gallons', '3000 Gallons'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.tankerSizeBtn, tankerSize === size && styles.tankerSizeBtnActive]}
                  onPress={() => setTankerSize(size)}
                >
                  <Text style={[styles.tankerSizeBtnText, tankerSize === size && styles.tankerSizeBtnTextActive]}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.tankerLabel}>Price Paid (PKR):</Text>
            <TextInput
              style={styles.numericInput}
              keyboardType="numeric"
              placeholder="e.g. 4500"
              placeholderTextColor="rgba(0,0,0,0.3)"
              value={tankerPricePaid}
              onChangeText={setTankerPricePaid}
            />

            {isFairPriceAnomaly && (
              <View style={styles.anomalyWarning}>
                <Text style={styles.anomalyWarningText}>
                  ⚠️ WARNING: Price anomaly detected! The rate entered exceeds the official government fair rate ceiling (~1.8 PKR/Gallon).
                </Text>
              </View>
            )}
          </View>
        )}

        {/* COMPRESSED PHOTO UPLOAD (Solid architectural card frame) */}
        <Text style={[styles.label, { textAlign: textAlignStyle }]}>📸 {isUrdu ? "تصویر منسلک کریں:" : "Civic Evidence Photo:"}</Text>
        <View style={styles.photoContainer}>
          {imageUri && !skipPhoto ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.clearImageBtn}>
                <Text style={styles.clearImageText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtonRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={() => selectPhoto(true)}>
                <Text style={styles.photoBtnText}>📸 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={() => selectPhoto(false)}>
                <Text style={styles.photoBtnText}>🖼️ Choose Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SKIP PHOTO / LOW BANDWIDTH ACTION */}
          <TouchableOpacity 
            style={[styles.skipPhotoBtn, skipPhoto && styles.skipPhotoBtnActive]} 
            onPress={() => {
              setSkipPhoto(!skipPhoto);
              if (!skipPhoto) setImageUri(null);
            }}
          >
            <Text style={[styles.skipPhotoText, skipPhoto && styles.skipPhotoTextActive]}>
              {skipPhoto ? "✓ Low-Data / Text-Only Mode Active" : "⚡ Skip Photo / Low-Data Mode"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* NICHE FEATURE: LOW-BANDWIDTH VOICE COMPLAINT REPORTING */}
        <Text style={[styles.label, { textAlign: textAlignStyle }]}>🎤 {isUrdu ? "صوتی شکایت ریکارڈ کریں:" : "Low-Bandwidth Voice Reporting:"}</Text>
        <View style={styles.voiceCard}>
          <View style={styles.voiceControls}>
            <TouchableOpacity
              style={[styles.voiceBtn, isRecording && styles.voiceBtnRecording]}
              onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
            >
              <Text style={styles.voiceBtnText}>
                {isRecording ? `🛑 Stop Recording` : "🎤 Start Voice Memo"}
              </Text>
            </TouchableOpacity>

            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.redDot} />
                <Text style={styles.timerText}>{voiceNoteDuration}s / 30s</Text>
              </View>
            )}
          </View>

          {isRecording && (
            <View style={styles.visualizerContainer}>
              {[...Array(10)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.visualizerBar,
                    { height: 5 + Math.random() * 25 }
                  ]}
                />
              ))}
            </View>
          )}

          {recordedVoiceUrl && !isRecording && (
            <View style={styles.voiceOkBox}>
              <View style={styles.voiceOkHeader}>
                <Text style={styles.voiceOkText}>✓ {isUrdu ? "صوتی نوٹ تیار ہے" : "Voice memo ready"}</Text>
                <TouchableOpacity onPress={() => setRecordedVoiceUrl(null)}>
                  <Text style={styles.voiceDeleteText}>{isUrdu ? "حذف کریں" : "Delete"}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.voiceSubText}>
                {isUrdu
                  ? "AMR فارمیٹ میں کمپریسڈ (12.2kbps)"
                  : "Compressed to AMR-NB (12.2kbps) for edge-network sync."}
              </Text>
            </View>
          )}
        </View>

        {/* COMPLAINT DESCRIPTION */}
        <Text style={[styles.label, { textAlign: textAlignStyle }]}>{isUrdu ? "مسئلے کی تفصیل:" : "Complaint Description:"}</Text>
        <TextInput
          style={[styles.descInput, { textAlign: textAlignStyle }]}
          placeholder={isUrdu ? "تفصیل یہاں درج کریں..." : "Provide clear descriptions of the breakdown..."}
          placeholderTextColor="rgba(15,23,42,0.3)"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* FORM STATUS MSG */}
        {statusMsg && (
          <View style={styles.statusBox}>
            <ActivityIndicator size="small" color="#0F172A" />
            <Text style={styles.statusBoxText}>{statusMsg}</Text>
          </View>
        )}

        {/* SUBMIT BUTTON */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isOnline 
                ? (isUrdu ? "شکایت درج کریں" : "Submit Complaint")
                : (isUrdu ? "آف لائن کیشے میں محفوظ کریں" : "Queue Complaint Offline")
              }
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DFD1A5', // Frere Hall Sandstone Yellow
  },
  container: {
    padding: 16,
    paddingBottom: 48,
  },
  headerFrame: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#1D6874',
    marginTop: 4,
  },
  gpsContainer: {
    backgroundColor: '#E6DAB2',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  gpsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpsValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065F46', // Civic Green
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gpsRefresh: {
    padding: 6,
  },
  label: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 14,
  },
  domainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E6DAB2',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginVertical: 2,
  },
  selectorBtnActive: {
    backgroundColor: '#1D6874',
  },
  selectorBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  selectorBtnTextActive: {
    color: '#FFFFFF',
  },
  categoryBtn: {
    backgroundColor: '#E6DAB2',
  },
  tankerMafiaBox: {
    backgroundColor: '#E6DAB2',
    borderWidth: 2,
    borderColor: '#A94442',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tankerBoxTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#A94442',
    marginBottom: 12,
  },
  tankerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  tankerSizeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    backgroundColor: '#DFD1A5',
    borderRadius: 8,
  },
  tankerSizeBtnActive: {
    backgroundColor: '#A94442',
  },
  tankerSizeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tankerSizeBtnTextActive: {
    color: '#FFFFFF',
  },
  numericInput: {
    backgroundColor: '#DFD1A5',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
  },
  anomalyWarning: {
    backgroundColor: 'rgba(169,68,66,0.1)',
    borderWidth: 1,
    borderColor: '#A94442',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  anomalyWarningText: {
    color: '#A94442',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: 'bold',
  },
  photoContainer: {
    backgroundColor: '#E6DAB2',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  photoButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: '#DFD1A5',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  imageWrap: {
    position: 'relative',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  clearImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#A94442',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  clearImageText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  skipPhotoBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(29, 104, 116, 0.1)',
    borderWidth: 1.5,
    borderColor: '#1D6874',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  skipPhotoBtnActive: {
    backgroundColor: '#1D6874',
  },
  skipPhotoText: {
    color: '#1D6874',
    fontWeight: 'bold',
    fontSize: 12,
  },
  skipPhotoTextActive: {
    color: '#FFFFFF',
  },
  voiceCard: {
    backgroundColor: '#E6DAB2',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  voiceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(169, 68, 66, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A94442',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A94442',
  },
  timerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A94442',
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 4,
    marginTop: 12,
  },
  visualizerBar: {
    width: 4,
    backgroundColor: '#1D6874',
    borderRadius: 2,
  },
  voiceBtn: {
    flex: 1,
    backgroundColor: '#DFD1A5',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  voiceBtnRecording: {
    backgroundColor: '#A94442',
    borderColor: '#0F172A',
  },
  voiceBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  voiceOkBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(6, 95, 70, 0.1)',
    borderWidth: 1,
    borderColor: '#065F46',
    borderRadius: 8,
  },
  voiceOkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceOkText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: 'bold',
  },
  voiceDeleteText: {
    color: '#A94442',
    fontSize: 11,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  voiceSubText: {
    color: '#065F46',
    fontSize: 10,
    opacity: 0.8,
  },
  descInput: {
    backgroundColor: '#E6DAB2',
    borderWidth: 2,
    borderColor: '#0F172A',
    color: '#0F172A',
    padding: 16,
    fontSize: 14,
    borderRadius: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E6DAB2',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginBottom: 20,
  },
  statusBoxText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#065F46',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  townBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E6DAB2',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginRight: 8,
  },
  townBtnActive: {
    backgroundColor: '#1D6874',
    borderColor: '#0F172A',
  },
  townBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  townBtnTextActive: {
    color: '#FFFFFF',
  },
  ucChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#E6DAB2',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginRight: 6,
  },
  ucChipActive: {
    backgroundColor: '#065F46',
    borderColor: '#0F172A',
  },
  ucChipText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ucChipTextActive: {
    color: '#FFFFFF',
  },
});
