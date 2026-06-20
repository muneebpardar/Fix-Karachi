import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/services/localization';
import { subscribeToReports, voteReport, getCurrentUserId } from '@/services/firebase';

export default function VerificationScreen() {
  const { t, flexDirectionStyle, textAlignStyle, alignItemsStyle, isUrdu } = useLanguage();
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<{ [key: string]: 'verify' | 'flag' }>({});
  
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToReports((updatedReports) => {
      // In the verification dashboard, we show reports that are 'Pending' or 'Verified'
      // and exclude those marked 'Spam' or 'Resolved'
      const reviewableReports = updatedReports.filter(r => r.status === 'Pending' || r.status === 'Verified');
      setReports(reviewableReports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVote = async (reportId: string, voteType: 'verify' | 'flag') => {
    setVotedIds(prev => ({
      ...prev,
      [reportId]: voteType
    }));

    try {
      await voteReport(reportId, currentUserId, voteType);
    } catch (error) {
      console.error("Verification vote failed:", error);
    }
  };

  const getDomainText = (domain: string) => {
    switch (domain) {
      case 'Civic Infrastructure': return t.filterCivic;
      case 'Utilities': return t.filterUtilities;
      case 'Public Safety': return t.filterSafety;
      case 'Transport': return t.filterTransport;
      case 'Environmental Crises': return t.filterEnvironmental;
      default: return domain;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Verified') {
      return (
        <View style={[styles.badge, styles.badgeVerified]}>
          <Text style={styles.badgeText}>{t.verifiedBadge}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgePending]}>
        <Text style={styles.badgeText}>{t.pendingBadge}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedScroll}
          
          ListHeaderComponent={
            <View>
              {/* HEADER BLOCK */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { textAlign: textAlignStyle }]}>
                  {t.verificationDashboard}
                </Text>
                <Text style={[styles.headerSubtitle, { textAlign: textAlignStyle }]}>
                  {t.verificationSubtitle}
                </Text>
              </View>

              {/* RULE EXPLAINER BLOCK */}
              <View style={styles.explainerCard}>
                <Text style={[styles.explainerTitle, { textAlign: textAlignStyle }]}>
                  {isUrdu ? "قواعدِ تصدیق" : "Crowdsourced Validation Rules"}
                </Text>
                <View style={[styles.ruleRow, { flexDirection: flexDirectionStyle }]}>
                  <Text style={styles.ruleBullet}>•</Text>
                  <Text style={[styles.ruleText, { textAlign: textAlignStyle }]}>
                    {isUrdu 
                      ? "نیٹ ووٹ 3 یا زائد ہونے پر شکایت 'تصدیق شدہ' ہو جاتی ہے۔" 
                      : "Net score of +3 promotes reports to Verified status for government attention."
                    }
                  </Text>
                </View>
                <View style={[styles.ruleRow, { flexDirection: flexDirectionStyle }]}>
                  <Text style={styles.ruleBullet}>•</Text>
                  <Text style={[styles.ruleText, { textAlign: textAlignStyle }]}>
                    {isUrdu 
                      ? "نیٹ ووٹ -3 یا اس سے کم ہونے پر شکایت 'اسپیم' ہو کر غائب ہو جاتی ہے۔" 
                      : "Net score of -3 flags the report as Spam, hiding it from public feed."
                    }
                  </Text>
                </View>
              </View>
            </View>
          }

          renderItem={({ item: report }) => {
            const userVoted = votedIds[report.id] || (
              report.upvotes?.includes(currentUserId) ? 'verify' :
              report.downvotes?.includes(currentUserId) ? 'flag' : null
            );
            
            const reportScore = report.verificationScore ?? (
              (report.upvotes?.length || 0) - (report.downvotes?.length || 0)
            );

            return (
              <View style={styles.reportCard}>
                {/* Card Header */}
                <View style={[styles.cardHeader, { flexDirection: flexDirectionStyle }]}>
                  <View style={{ flex: 1, alignItems: alignItemsStyle }}>
                    <Text style={styles.cardCategory}>
                      {(t as any)[report.category.toLowerCase().replace(/[^a-zA-Z]/g, '')] || report.category}
                    </Text>
                    <Text style={styles.cardDomain}>{getDomainText(report.domain)}</Text>
                  </View>
                  {getStatusBadge(report.status)}
                </View>

                {/* Card Image */}
                {report.imageUrl ? (
                  <Image 
                    source={{ uri: report.imageUrl }} 
                    style={styles.cardImage} 
                    resizeMode="cover"
                  />
                ) : null}

                {/* Card Description */}
                <Text style={[styles.cardDescription, { textAlign: textAlignStyle }]}>
                  {report.description}
                </Text>

                <View style={styles.divider} />

                {/* Action Voting Block */}
                <View style={[styles.votingRow, { flexDirection: flexDirectionStyle }]}>
                  <View style={[styles.scoreBlock, { flexDirection: flexDirectionStyle }]}>
                    <Text style={styles.scoreLabel}>{isUrdu ? "نیٹ ووٹ:" : "Net Score:"}</Text>
                    <Text style={[
                      styles.scoreValue, 
                      reportScore > 0 ? styles.positiveScore : reportScore < 0 ? styles.negativeScore : null
                    ]}>
                      {reportScore > 0 ? `+${reportScore}` : reportScore}
                    </Text>
                  </View>

                  <View style={[styles.actionButtons, { flexDirection: flexDirectionStyle }]}>
                    <TouchableOpacity 
                      style={[
                        styles.voteBtn, 
                        styles.verifyBtn,
                        userVoted === 'verify' && styles.verifyBtnActive
                      ]}
                      onPress={() => handleVote(report.id, 'verify')}
                    >
                      <Text style={[
                        styles.voteBtnText,
                        userVoted === 'verify' && styles.voteBtnTextActive
                      ]}>
                        👍 {t.verifyButton}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.voteBtn, 
                        styles.flagBtn,
                        userVoted === 'flag' && styles.flagBtnActive
                      ]}
                      onPress={() => handleVote(report.id, 'flag')}
                    >
                      <Text style={[
                        styles.voteBtnText,
                        userVoted === 'flag' && styles.voteBtnTextActive
                      ]}>
                        👎 {t.flagButton}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}

          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isUrdu ? "تصدیق کے لیے کوئی شکایت دستیاب نہیں ہے۔" : "All reported issues are currently validated!"}
                </Text>
              </View>
            ) : null
          }
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1D6874" />
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DFD1A5', // Sandstone Yellow
  },
  container: {
    flex: 1,
    backgroundColor: '#DFD1A5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#DFD1A5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#1D6874',
    marginTop: 4,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  explainerCard: {
    backgroundColor: '#E6DAB2', // Darker Sandstone Blocks
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  explainerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D6874', // Coastal Teal
    marginBottom: 8,
  },
  ruleRow: {
    gap: 8,
    marginTop: 6,
    alignItems: 'flex-start',
  },
  ruleBullet: {
    color: '#1D6874',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ruleText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(223, 209, 165, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    color: '#1D6874',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  feedScroll: {
    paddingBottom: 36,
  },
  reportCard: {
    backgroundColor: '#E6DAB2',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  cardCategory: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardDomain: {
    color: '#1D6874',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  badgePending: {
    backgroundColor: '#DFD1A5',
  },
  badgeVerified: {
    backgroundColor: '#065F46', // Civic Green
  },
  badgeText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginVertical: 10,
  },
  cardDescription: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 20,
    marginVertical: 8,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#0F172A',
    opacity: 0.15,
    marginVertical: 12,
  },
  votingRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  scoreBlock: {
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  positiveScore: {
    color: '#065F46', // Civic Green
  },
  negativeScore: {
    color: '#A94442', // Terracotta Red
  },
  actionButtons: {
    gap: 8,
  },
  voteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#DFD1A5',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  voteBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifyBtn: {
    marginRight: 6,
  },
  verifyBtnActive: {
    backgroundColor: '#065F46', // Civic Green active
    borderColor: '#0F172A',
  },
  flagBtnActive: {
    backgroundColor: '#A94442', // Terracotta Red active
    borderColor: '#0F172A',
  },
  flagBtn: {},
  voteBtnTextActive: {
    color: '#FFFFFF',
  },
});
