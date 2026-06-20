import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  ScrollView,
  TextInput,
  Platform
} from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/services/localization';
import { 
  subscribeToAnnouncements, 
  logoutUser, 
  fetchReportsPaginated, 
  getCurrentUserId, 
  subscribeToAuth, 
  subscribeToReports, 
  updateReportStatus, 
  addAnnouncement 
} from '@/services/firebase';
import useCachedSync from '@/hooks/useCachedSync';
import { useFocusEffect } from 'expo-router';

const PAGE_SIZE = 5;

export default function DashboardScreen() {
  const { t, isUrdu, flexDirectionStyle, textAlignStyle, alignItemsStyle, language, setLanguage } = useLanguage();
  const { isOnline, offlineQueueSize, blePeersCount, syncOfflineQueue, syncing } = useCachedSync();

  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [showMyReports, setShowMyReports] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnounceIndex, setActiveAnnounceIndex] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState('All');

  // Zonal Authority states
  const [currentUser, setCurrentUser] = useState(null);
  const [allReports, setAllReports] = useState([]);

  // Announcement publishing inputs
  const [newAnnTitleEn, setNewAnnTitleEn] = useState('');
  const [newAnnTitleUr, setNewAnnTitleUr] = useState('');
  const [newAnnDescEn, setNewAnnDescEn] = useState('');
  const [newAnnDescUr, setNewAnnDescUr] = useState('');
  const [annType, setAnnType] = useState('emergency');
  const [pubLoading, setPubLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const playVoiceNote = async (reportId) => {
    if (playingAudioId === reportId) return;
    try {
      setPlayingAudioId(reportId);
      const url = 'https://actions.google.com/sounds/v1/human_voices/human_chatter.ogg';
      let player = null;

      // Platform split: HTML5 Audio for Web, expo-audio for Native Mobile
      if (Platform.OS === 'web') {
        player = new window.Audio(url);
        player.play();
      } else {
        player = createAudioPlayer(url);
        player.play();
      }
      
      // Reset state after 4 seconds (simulated clip length)
      setTimeout(() => {
        setPlayingAudioId(null);
        try {
          if (player) {
            player.pause();
            if (Platform.OS !== 'web') {
              player.release();
            }
          }
        } catch(e) {}
      }, 4000);
    } catch (e) {
      console.warn("Audio play failed:", e);
      setPlayingAudioId(null);
    }
  };

  // Simulated Civic Duty Trust Score Engine
  const [trustScore, setTrustScore] = useState(120); 
  const [rank, setRank] = useState(isUrdu ? "معزز شہری" : "Honorary Citizen");

  // Load Feed Data
  const loadInitialFeed = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { reports: firstBatch, lastDoc: newLastDoc } = await fetchReportsPaginated(PAGE_SIZE, null);
      setReports(firstBatch);
      setLastDoc(newLastDoc);
      setHasMore(firstBatch.length >= PAGE_SIZE);
      
      // Calculate dynamic user trust score based on report validations
      const myId = getCurrentUserId();
      const myReports = firstBatch.filter(r => r.reporterId === myId);
      const points = 100 + (myReports.length * 15);
      setTrustScore(points);
      
      if (points >= 150) {
        setRank(isUrdu ? "شہری محافظ" : "Civic Guardian");
      } else if (points >= 120) {
        setRank(isUrdu ? "فعال شہری" : "Active Citizen");
      } else {
        setRank(isUrdu ? "معزز شہری" : "Honorary Citizen");
      }
    } catch (err) {
      console.warn("Failed fetching dashboard feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFeed = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const { reports: nextBatch, lastDoc: newLastDoc } = await fetchReportsPaginated(PAGE_SIZE, lastDoc);
      setReports(prev => [...prev, ...nextBatch]);
      setLastDoc(newLastDoc);
      setHasMore(nextBatch.length >= PAGE_SIZE);
    } catch (err) {
      console.warn("Failed loading more feed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialFeed(false);
    setIsRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadInitialFeed(false);
    }, [])
  );

  useEffect(() => {
    // Subscribe to emergency broadcasts
    const unsubscribeAnnouncements = subscribeToAnnouncements((updated) => {
      setAnnouncements(updated);
    });

    // Subscribe to Firebase & Mock auth states
    const unsubscribeAuth = subscribeToAuth((usr) => {
      setCurrentUser(usr);
    });

    return () => {
      unsubscribeAnnouncements();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    // Real-time report subscription for zonal authority console
    if (currentUser?.role === 'authority') {
      const unsubscribeReports = subscribeToReports((updated) => {
        setAllReports(updated);
      });
      return () => unsubscribeReports();
    }
  }, [currentUser]);

  const handlePublishAnnouncement = async () => {
    if (!newAnnTitleEn.trim() || !newAnnTitleUr.trim()) {
      alert("Please enter both English and Urdu titles.");
      return;
    }
    setPubLoading(true);
    try {
      await addAnnouncement({
        titleEn: `[TMC ${currentUser.town || ''}] ${newAnnTitleEn.trim()}`,
        titleUr: `[TMC ${currentUser.town || ''}] ${newAnnTitleUr.trim()}`,
        descriptionEn: newAnnDescEn.trim() || 'Zonal Authority Advisory',
        descriptionUr: newAnnDescUr.trim() || 'بلدیاتی ایڈوائزری',
        type: annType
      });
      setNewAnnTitleEn('');
      setNewAnnTitleUr('');
      setNewAnnDescEn('');
      setNewAnnDescUr('');
      alert("Announcement successfully published to all citizen feeds!");
    } catch (e) {
      console.error("Publish announcement failed:", e);
      alert("Error: Failed to broadcast announcement.");
    } finally {
      setPubLoading(false);
    }
  };

  // Cycle emergency broadcast text
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAnnounceIndex(prev => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements]);

  const filteredReports = selectedDomain === 'All' 
    ? reports 
    : reports.filter(r => r.domain === selectedDomain);

  const getDomainLabel = (dom) => {
    switch (dom) {
      case 'Civic Infrastructure': return t.filterCivic;
      case 'Utilities': return t.filterUtilities;
      case 'Public Safety': return t.filterSafety;
      case 'Transport': return t.filterTransport;
      default: return dom;
    }
  };

  const domains = ['All', 'Civic Infrastructure', 'Utilities', 'Public Safety', 'Transport'];

  const renderAuthorityConsole = () => {
    // Filter local reports matching current authority's town and UC
    const localReports = allReports.filter(
      r => r.town === currentUser?.town && r.uc === currentUser?.uc
    );

    // Calculate stats
    const totalCount = localReports.length;
    const pendingCount = localReports.filter(r => r.status === 'Pending').length;
    const verifiedCount = localReports.filter(r => r.status === 'Verified').length;
    const resolvedCount = localReports.filter(r => r.status === 'Resolved').length;
    const spamCount = localReports.filter(r => r.status === 'Spam').length;

    return (
      <ScrollView contentContainerStyle={styles.adminScrollContent} keyboardShouldPersistTaps="handled">
        {/* Zonal Header Banner */}
        <View style={styles.adminHeaderCard}>
          <Text style={styles.adminHeading}>🏛️ Zonal Authority Console</Text>
          <Text style={styles.adminTmcText}>TMC {currentUser?.town}</Text>
          <Text style={styles.adminUcText}>{currentUser?.uc}</Text>
          <View style={styles.adminRepRow}>
            <Text style={styles.adminRepLabel}>Chairman:</Text>
            <Text style={styles.adminRepName}>{currentUser?.chairmanName || 'Official Representative'}</Text>
          </View>
          {currentUser?.contact && (
            <Text style={styles.adminContactText}>☎️ Phone: {currentUser.contact}</Text>
          )}
          <Text style={styles.adminEmailText}>✉️ Email: {currentUser?.email}</Text>
          
          <TouchableOpacity style={styles.adminLogoutBtn} onPress={logoutUser}>
            <Text style={styles.adminLogoutText}>{isUrdu ? "خروج / لاگ آؤٹ" : "Logout Admin Session"}</Text>
          </TouchableOpacity>
        </View>

        {/* Locality Statistics */}
        <View style={styles.adminStatsContainer}>
          <View style={[styles.adminStatCard, { borderLeftColor: '#0F172A' }]}>
            <Text style={styles.adminStatValue}>{totalCount}</Text>
            <Text style={styles.adminStatLabel}>Total Issues</Text>
          </View>
          <View style={[styles.adminStatCard, { borderLeftColor: '#A94442' }]}>
            <Text style={styles.adminStatValue}>{pendingCount}</Text>
            <Text style={styles.adminStatLabel}>Pending</Text>
          </View>
          <View style={[styles.adminStatCard, { borderLeftColor: '#1D6874' }]}>
            <Text style={styles.adminStatValue}>{verifiedCount}</Text>
            <Text style={styles.adminStatLabel}>Verified</Text>
          </View>
          <View style={[styles.adminStatCard, { borderLeftColor: '#065F46' }]}>
            <Text style={styles.adminStatValue}>{resolvedCount}</Text>
            <Text style={styles.adminStatLabel}>Resolved</Text>
          </View>
        </View>

        {/* Announcement Publisher Form */}
        <View style={styles.adminPublishBox}>
          <Text style={styles.publishBoxTitle}>🚨 Broadcast Emergency / Locality Alert</Text>
          <Text style={styles.publishBoxSub}>This broadcast will appear on the scroller of all citizens in {currentUser?.town}.</Text>
          
          <Text style={styles.formInputLabel}>English Advisory Title:</Text>
          <TextInput
            style={styles.adminTextInput}
            placeholder="e.g. Severe water line maintenance scheduled..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={newAnnTitleEn}
            onChangeText={setNewAnnTitleEn}
          />

          <Text style={styles.formInputLabel}>Urdu Advisory Title (اردو عنوان):</Text>
          <TextInput
            style={styles.adminTextInput}
            placeholder="مثال: پانی کی لائن کی بندش..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={newAnnTitleUr}
            onChangeText={setNewAnnTitleUr}
          />

          <Text style={styles.formInputLabel}>English Description:</Text>
          <TextInput
            style={[styles.adminTextInput, { height: 60 }]}
            multiline
            placeholder="Details, duration, alternatives..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={newAnnDescEn}
            onChangeText={setNewAnnDescEn}
          />

          <Text style={styles.formInputLabel}>Urdu Description (اردو تفصیل):</Text>
          <TextInput
            style={[styles.adminTextInput, { height: 60 }]}
            multiline
            placeholder="تفصیلات..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={newAnnDescUr}
            onChangeText={setNewAnnDescUr}
          />

          <Text style={styles.formInputLabel}>Alert Severity Type:</Text>
          <View style={styles.annTypeRow}>
            {['emergency', 'warning', 'info'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.annTypeBtn, annType === type && styles.annTypeBtnActive]}
                onPress={() => setAnnType(type)}
              >
                <Text style={[styles.annTypeBtnText, annType === type && styles.annTypeBtnTextActive]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.adminPublishBtn} 
            onPress={handlePublishAnnouncement} 
            disabled={pubLoading}
          >
            {pubLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.adminPublishBtnText}>📢 Broadcast Alert to Citizens</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Complaints Feed */}
        <Text style={styles.adminSectionHeader}>📋 Locality Complaints ({totalCount})</Text>

        {localReports.length === 0 ? (
          <View style={styles.adminEmptyBox}>
            <Text style={styles.adminEmptyText}>No active complaints reported in your Union Committee.</Text>
          </View>
        ) : (
          localReports.map((report) => {
            const up = report.upvotes?.length || 0;
            const down = report.downvotes?.length || 0;
            const votesCount = up - down;
            return (
              <View key={report.id} style={styles.adminReportCard}>
                <View style={styles.adminReportHeader}>
                  <View>
                    <Text style={styles.adminReportCategory}>{report.category}</Text>
                    <Text style={styles.adminReportDomain}>{getDomainLabel(report.domain)}</Text>
                  </View>
                  <View style={[
                    styles.adminStatusBadge,
                    { backgroundColor: report.status === 'Resolved' ? '#065F46' : report.status === 'Verified' ? '#1D6874' : report.status === 'Spam' ? '#991B1B' : '#A94442' }
                  ]}>
                    <Text style={styles.adminStatusBadgeText}>{report.status}</Text>
                  </View>
                </View>

                {report.imageUrl ? (
                  <Image source={{ uri: report.imageUrl }} style={styles.adminReportImage} resizeMode="cover" />
                ) : null}

                <Text style={styles.adminReportDesc}>{report.description}</Text>

                <View style={styles.adminReportMetaRow}>
                  <Text style={styles.adminReportMetaText}>Reporter: {report.reporterId?.substring(0, 8)}</Text>
                  <Text style={styles.adminReportMetaText}>Consensus: {votesCount > 0 ? `+${votesCount}` : votesCount}</Text>
                </View>

                {/* Status Update Controls */}
                <Text style={styles.adminActionTitle}>Change Status / Flag Issue:</Text>
                <View style={styles.adminActionRow}>
                  {['Pending', 'Verified', 'Resolved', 'Spam'].map((status) => {
                    const isActive = report.status === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusActionBtn,
                          isActive && styles.statusActionBtnActive,
                          isActive && status === 'Resolved' && { backgroundColor: '#065F46' },
                          isActive && status === 'Verified' && { backgroundColor: '#1D6874' },
                          isActive && status === 'Spam' && { backgroundColor: '#991B1B' },
                          isActive && status === 'Pending' && { backgroundColor: '#A94442' },
                        ]}
                        onPress={() => updateReportStatus(report.id, status)}
                      >
                        <Text style={[styles.statusActionText, isActive && styles.statusActionTextActive]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 1. OFFLINE-SYNC STATUS BAR */}
      <View style={[styles.syncStatusBar, { backgroundColor: isOnline ? '#065F46' : '#991B1B' }]}>
        <View style={styles.syncStatusLeft}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#F87171' }]} />
          <Text style={styles.syncStatusText}>
            {isOnline 
              ? (isUrdu ? "نیٹ ورک فعال ہے (آن لائن)" : "Network Connected (Online)") 
              : (isUrdu ? "نیٹ ورک بند ہے (آف لائن)" : "Network Down (Offline Mode)")
            }
          </Text>
        </View>
        <View style={styles.syncStatusRight}>
          {offlineQueueSize > 0 && (
            <TouchableOpacity onPress={syncOfflineQueue} style={styles.syncBtn}>
              <Text style={styles.syncBtnText}>
                🔄 {isUrdu ? `${offlineQueueSize} ہولڈ` : `${offlineQueueSize} Queued`}
              </Text>
            </TouchableOpacity>
          )}
          {blePeersCount > 0 && (
            <Text style={styles.meshBadge}>
              📶 {isUrdu ? `${blePeersCount} ہم مرتبہ` : `${blePeersCount} BLE Peers`}
            </Text>
          )}
        </View>
      </View>

      {currentUser?.role === 'authority' ? (
        renderAuthorityConsole()
      ) : (
        <View style={styles.container}>
        
        {/* FLATLIST RENDER WITH SCROLLABLE HEADERS */}
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          onEndReached={loadMoreFeed}
          onEndReachedThreshold={0.4}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.scrollContent}

          ListHeaderComponent={
            <View>
              {/* BRAND HEADER BLOCK (Truck Art inspired bold monochrome frames + Hala Tile geometry) */}
              <View style={styles.brandContainer}>
                <View style={[styles.truckArtBorder, { flexDirection: flexDirectionStyle }]}>
                  <Text style={styles.truckArtCorner}>★</Text>
                  <Text style={styles.brandTitle}>FIX KARACHI</Text>
                  <Text style={styles.truckArtCorner}>★</Text>
                </View>
                
                {/* Hala Tile divider line-art */}
                <View style={styles.halaTileRow}>
                  <View style={styles.halaTileDiamond} />
                  <View style={styles.halaTileLine} />
                  <View style={styles.halaTileDiamondActive} />
                  <View style={styles.halaTileLine} />
                  <View style={styles.halaTileDiamond} />
                </View>
                
                {/* Language Switcher & Sign Out Row */}
                <View style={[styles.controlRow, { flexDirection: flexDirectionStyle }]}>
                  <TouchableOpacity 
                    style={styles.langToggle} 
                    onPress={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                  >
                    <Text style={styles.langToggleText}>
                      {language === 'en' ? 'اردو (Urdu RTL)' : 'English (EN LTR)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
                    <Text style={styles.logoutBtnText}>{isUrdu ? "خروج" : "Logout"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* CIVIC DUTY TRUST SCORE ENGINE CARD */}
              <View style={styles.trustScoreCard}>
                <Text style={[styles.trustTitle, { textAlign: textAlignStyle }]}>
                  🛡️ {isUrdu ? "شہری دیانت داری سکور" : "Civic Duty Trust Score"}
                </Text>
                <View style={[styles.trustRow, { flexDirection: flexDirectionStyle }]}>
                  <View style={styles.scoreBlock}>
                    <Text style={styles.scoreNum}>{trustScore}</Text>
                    <Text style={styles.scoreSub}>{isUrdu ? "پوائنٹس" : "Civic Points"}</Text>
                  </View>
                  <View style={[styles.rankBlock, { alignItems: alignItemsStyle }]}>
                    <Text style={styles.rankLabel}>{isUrdu ? "رینک:" : "Current Rank:"}</Text>
                    <Text style={styles.rankValue}>{rank}</Text>
                    <Text style={[styles.rankDesc, { textAlign: textAlignStyle }]}>
                      {isUrdu 
                        ? "تصدیق شدہ رپورٹس جمع کروا کر اپنا سکور بڑھائیں۔" 
                        : "Maintain accurate reporting and verification history to level up."
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* EMERGENCY BROADCASTS MARQUEE (Empress Market red brick warning state) */}
              {announcements.length > 0 ? (
                <View style={styles.emergencyBanner}>
                  <View style={styles.warningTag}>
                    <Text style={styles.warningTagText}>🚨 {isUrdu ? "اہم" : "ALERT"}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marqueeScroll}>
                    <Text style={styles.marqueeText}>
                      {isUrdu 
                        ? announcements[activeAnnounceIndex]?.titleUr || announcements[activeAnnounceIndex]?.titleEn
                        : announcements[activeAnnounceIndex]?.titleEn
                      }
                      <Text style={styles.marqueeDesc}>
                        {"  -  "}
                        {isUrdu 
                          ? announcements[activeAnnounceIndex]?.descriptionUr || announcements[activeAnnounceIndex]?.descriptionEn
                          : announcements[activeAnnounceIndex]?.descriptionEn
                        }
                      </Text>
                    </Text>
                  </ScrollView>
                </View>
              ) : null}

              {/* DOMAIN FILTERS GRID (Traditional solid block architectural layout) */}
              <Text style={[styles.sectionTitle, { textAlign: textAlignStyle }]}>
                {isUrdu ? "مسائل کے شعبہ جات" : "Select Civic Domain"}
              </Text>
              <View style={[styles.filterGrid, { flexDirection: flexDirectionStyle }]}>
                {domains.map((dom) => (
                  <TouchableOpacity
                    key={dom}
                    style={[
                      styles.filterCard,
                      selectedDomain === dom && styles.filterCardActive
                    ]}
                    onPress={() => setSelectedDomain(dom)}
                  >
                    <Text style={[
                      styles.filterCardText,
                      selectedDomain === dom && styles.filterCardTextActive
                    ]}>
                      {dom === 'All' ? (isUrdu ? "تمام شکایتیں" : "All Issues") : getDomainLabel(dom)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* TRANSPARENCY FEED HEADER */}
              <Text style={[styles.sectionTitle, { textAlign: textAlignStyle, marginTop: 16 }]}>
                📢 {isUrdu ? "عوامی شفافیت فیڈ" : "Global Transparency Feed"}
              </Text>
            </View>
          }

          renderItem={({ item: report }) => {
            const votesCount = (report.upvotes?.length || 0) - (report.downvotes?.length || 0);

            return (
              <View style={styles.reportCard}>
                {/* Truck Art style geometric border */}
                <View style={styles.cardHeaderLine} />
                
                <View style={[styles.cardHeader, { flexDirection: flexDirectionStyle }]}>
                  <View style={{ flex: 1, alignItems: alignItemsStyle }}>
                    <Text style={styles.cardCategory}>{report.category}</Text>
                    <Text style={styles.cardDomain}>{getDomainLabel(report.domain)}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: report.status === 'Verified' ? '#1D6874' : report.status === 'Resolved' ? '#065F46' : '#A94442' }
                  ]}>
                    <Text style={styles.statusText}>
                      {report.status === 'Verified' ? (isUrdu ? "تصدیق شدہ" : "Verified") : 
                       report.status === 'Resolved' ? (isUrdu ? "حل شدہ" : "Resolved") : 
                       (isUrdu ? "جاری" : "Pending")}
                    </Text>
                  </View>
                </View>

                {report.imageUrl ? (
                  <Image source={{ uri: report.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                ) : null}

                {/* Localized Voice Note Playback Button */}
                {report.voiceUrl ? (
                  <TouchableOpacity 
                    style={[styles.voiceIndicator, { flexDirection: flexDirectionStyle }]}
                    onPress={() => playVoiceNote(report.id)}
                  >
                    <Text style={styles.voiceIcon}>{playingAudioId === report.id ? '🔊' : '🎤'}</Text>
                    <Text style={[styles.voiceText, playingAudioId === report.id && { color: '#065F46', fontWeight: 'bold' }]}>
                      {playingAudioId === report.id 
                        ? (isUrdu ? "آڈیو چل رہی ہے..." : "Playing audio memo...") 
                        : (isUrdu ? "صوتی شکایت سنیں" : "Play attached voice complaint")}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Tanker Fair Price cost details */}
                {report.tankerPrice ? (
                  <View style={[styles.priceAlertBox, { flexDirection: flexDirectionStyle }]}>
                    <Text style={styles.priceAlertTitle}>💧 {isUrdu ? "ٹینکر کی قیمت:" : "Tanker Price:"}</Text>
                    <Text style={styles.priceAlertVal}>{report.tankerPrice} PKR</Text>
                  </View>
                ) : null}

                <Text style={[styles.cardDesc, { textAlign: textAlignStyle }]}>{report.description}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.metaText}>
                    👤 {isUrdu ? "شہری ID:" : "Reporter ID:"} {report.reporterId?.substring(0, 8)}
                  </Text>
                  <Text style={styles.metaText}>
                    📶 {votesCount > 0 ? `+${votesCount}` : votesCount} {isUrdu ? "تصدیق" : "Consensus"}
                  </Text>
                </View>
              </View>
            );
          }}

          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  {isUrdu ? "اس شعبے میں کوئی شکایت دستیاب نہیں ہے۔" : "No complaints found in this civic domain."}
                </Text>
              </View>
            ) : null
          }

          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreBlock}>
                <ActivityIndicator size="small" color="#065F46" />
              </View>
            ) : null
          }
        />

        {loading && (
          <View style={styles.globalLoader}>
            <ActivityIndicator size="large" color="#065F46" />
            <Text style={styles.loaderText}>{isUrdu ? "ڈیٹا لوڈ ہو رہا ہے..." : "Syncing Karachi Portal..."}</Text>
          </View>
        )}

        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DFD1A5', // Frere Hall Sandstone Yellow
  },
  container: {
    flex: 1,
  },
  syncStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderColor: '#0F172A',
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  syncStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  meshBadge: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  brandContainer: {
    padding: 16,
    alignItems: 'center',
  },
  truckArtBorder: {
    borderWidth: 3,
    borderColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#DFD1A5',
    alignItems: 'center',
    gap: 8,
  },
  truckArtCorner: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  brandTitle: {
    color: '#065F46', // Civic Green
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  halaTileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 10,
    gap: 6,
  },
  halaTileDiamond: {
    width: 8,
    height: 8,
    backgroundColor: '#1D6874', // Coastal Teal
    transform: [{ rotate: '45deg' }],
  },
  halaTileDiamondActive: {
    width: 12,
    height: 12,
    backgroundColor: '#A94442', // Red Terracotta warning
    transform: [{ rotate: '45deg' }],
  },
  halaTileLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#0F172A',
  },
  controlRow: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  langToggle: {
    backgroundColor: '#1D6874',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  langToggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: '#A94442',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  trustScoreCard: {
    backgroundColor: '#E6DAB2',
    borderWidth: 2,
    borderColor: '#0F172A',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  trustRow: {
    alignItems: 'center',
    gap: 12,
  },
  scoreBlock: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0F172A',
    backgroundColor: '#DFD1A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065F46',
  },
  scoreSub: {
    fontSize: 9,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  rankBlock: {
    flex: 1,
    gap: 2,
  },
  rankLabel: {
    fontSize: 11,
    color: '#1D6874',
    fontWeight: 'bold',
  },
  rankValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A94442',
  },
  rankDesc: {
    fontSize: 11,
    color: '#0F172A',
    marginTop: 4,
    lineHeight: 15,
  },
  emergencyBanner: {
    backgroundColor: '#7F1D1D',
    borderWidth: 2,
    borderColor: '#0F172A',
    marginHorizontal: 16,
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  warningTag: {
    backgroundColor: '#A94442',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 2,
    borderColor: '#0F172A',
  },
  warningTagText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  marqueeScroll: {
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 40,
  },
  marqueeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  marqueeDesc: {
    color: '#FCA5A5',
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterGrid: {
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  filterCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E6DAB2',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 10,
  },
  filterCardActive: {
    backgroundColor: '#1D6874',
  },
  filterCardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  filterCardTextActive: {
    color: '#FFFFFF',
  },
  reportCard: {
    backgroundColor: '#E6DAB2', // Flat architectural block
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    overflow: 'hidden',
  },
  cardHeaderLine: {
    height: 4,
    backgroundColor: '#1D6874',
  },
  cardHeader: {
    padding: 14,
    alignItems: 'flex-start',
    gap: 6,
  },
  cardCategory: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardDomain: {
    fontSize: 11,
    color: '#1D6874',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#0F172A',
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 104, 116, 0.1)',
    marginHorizontal: 14,
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1D6874',
    borderRadius: 8,
    gap: 8,
  },
  voiceIcon: {
    fontSize: 14,
  },
  voiceText: {
    color: '#1D6874',
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  priceAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(169, 68, 66, 0.1)',
    marginHorizontal: 14,
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A94442',
    borderRadius: 8,
    gap: 6,
  },
  priceAlertTitle: {
    color: '#A94442',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceAlertVal: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDesc: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  metaText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  loadingMoreBlock: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  globalLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(223, 209, 165, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  adminScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  adminHeaderCard: {
    backgroundColor: '#DFD1A5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#0F172A',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  adminHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  adminTmcText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D6874',
    marginBottom: 2,
  },
  adminUcText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 12,
  },
  adminRepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminRepLabel: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    marginRight: 6,
  },
  adminRepName: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  adminContactText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    marginBottom: 2,
  },
  adminEmailText: {
    fontSize: 12,
    color: 'rgba(15, 23, 42, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  adminLogoutBtn: {
    backgroundColor: '#A94442',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  adminLogoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  adminStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  adminStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#E6DAB2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderLeftWidth: 6,
  },
  adminStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  adminStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(15, 23, 42, 0.7)',
  },
  adminPublishBox: {
    backgroundColor: '#E6DAB2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0F172A',
    marginBottom: 24,
  },
  publishBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  publishBoxSub: {
    fontSize: 11,
    color: 'rgba(15, 23, 42, 0.7)',
    marginBottom: 14,
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
    marginTop: 8,
  },
  adminTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 13,
  },
  annTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  annTypeBtn: {
    flex: 1,
    backgroundColor: '#DFD1A5',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  annTypeBtnActive: {
    backgroundColor: '#1D6874',
  },
  annTypeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  annTypeBtnTextActive: {
    color: '#FFFFFF',
  },
  adminPublishBtn: {
    backgroundColor: '#065F46',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginTop: 12,
  },
  adminPublishBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminSectionHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 8,
  },
  adminEmptyBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0F172A',
  },
  adminEmptyText: {
    color: '#0F172A',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  adminReportCard: {
    backgroundColor: '#DFD1A5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0F172A',
    padding: 16,
    marginBottom: 16,
  },
  adminReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adminReportCategory: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  adminReportDomain: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D6874',
    marginTop: 2,
  },
  adminStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  adminStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  adminReportImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginBottom: 12,
  },
  adminReportDesc: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  adminReportMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.1)',
  },
  adminReportMetaText: {
    fontSize: 11,
    color: 'rgba(15, 23, 42, 0.6)',
    fontWeight: '600',
  },
  adminActionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusActionBtn: {
    flex: 1,
    backgroundColor: '#E6DAB2',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusActionBtnActive: {
    borderColor: '#0F172A',
  },
  statusActionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusActionTextActive: {
    color: '#FFFFFF',
  },
});
