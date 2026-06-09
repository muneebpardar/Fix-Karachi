import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/services/localization';
import { loginWithEmail, signUpWithEmail, initializeAnonymousAuth } from '@/services/firebase';

import { KARACHI_TOWNS } from '../services/karachiData';

export default function LoginScreen() {
  const { t, isUrdu, flexDirectionStyle, textAlignStyle, alignItemsStyle } = useLanguage();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'authority'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Zonal Authority selector states
  const [selectedTown, setSelectedTown] = useState(KARACHI_TOWNS[0].name);
  const [selectedUC, setSelectedUC] = useState(KARACHI_TOWNS[0].ucs[0].ucNo + ' ' + KARACHI_TOWNS[0].ucs[0].name);

  const handleTownChange = (townName: string) => {
    setSelectedTown(townName);
    const townObj = KARACHI_TOWNS.find(t => t.name === townName);
    if (townObj && townObj.ucs.length > 0) {
      setSelectedUC(townObj.ucs[0].ucNo + ' ' + townObj.ucs[0].name);
    }
  };

  const handleAuthAction = async () => {
    if (activeTab !== 'authority' && (!email || !password)) {
      setErrorMsg(isUrdu ? "براہ کرم تمام خانے پُر کریں۔" : "Please fill in all fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'signin') {
        await loginWithEmail(email.trim(), password);
      } else if (activeTab === 'signup') {
        await signUpWithEmail(email.trim(), password);
      } else if (activeTab === 'authority') {
        // Find the designated email for the selected Town and UC
        const townObj = KARACHI_TOWNS.find(t => t.name === selectedTown);
        const ucObj = townObj?.ucs.find(u => `${u.ucNo} ${u.name}` === selectedUC);
        if (ucObj) {
          console.log(`Logging in as zonal authority for ${selectedTown} - ${selectedUC}: ${ucObj.email}`);
          try {
            await loginWithEmail(ucObj.email, "authority123");
          } catch (loginErr: any) {
            // Auto-signup the admin for the hackathon demo if they don't exist yet in Firebase
            console.log("Admin account not found, auto-creating one for demo purposes...");
            await signUpWithEmail(ucObj.email, "authority123");
          }
        } else {
          throw new Error("Invalid town or UC selection");
        }
      }
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      // Clean up firebase error message
      const rawMsg = err.message || '';
      if (rawMsg.includes('auth/invalid-credential')) {
        setErrorMsg(isUrdu ? "غلط ای میل یا پاس ورڈ۔" : "Incorrect email or password.");
      } else if (rawMsg.includes('auth/email-already-in-use')) {
        setErrorMsg(isUrdu ? "یہ ای میل پہلے سے زیرِ استعمال ہے۔" : "This email is already registered.");
      } else if (rawMsg.includes('auth/weak-password')) {
        setErrorMsg(isUrdu ? "پاس ورڈ کم از کم 6 حروف پر مشتمل ہونا چاہیے۔" : "Password must be at least 6 characters.");
      } else if (rawMsg.includes('auth/invalid-email')) {
        setErrorMsg(isUrdu ? "براہ کرم درست ای میل درج کریں۔" : "Please enter a valid email address.");
      } else {
        setErrorMsg(rawMsg || (isUrdu ? "تصدیق ناکام ہو گئی۔ دوبارہ کوشش کریں۔" : "Authentication failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await initializeAnonymousAuth();
    } catch (err: any) {
      console.error("Guest login failed:", err);
      setErrorMsg(isUrdu ? "مہمان لاگ ان ناکام ہو گیا۔" : "Guest login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Brand Logo Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>FK</Text>
            </View>
            <Text style={styles.title}>Fix Karachi</Text>
            <Text style={styles.subtitle}>
              {isUrdu ? "شہری مسائل کے حل اور شفافیت کا پورٹل" : "Civic Action & Transparency Platform"}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            
            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabContainer, { flexDirection: flexDirectionStyle, borderBottomWidth: 0 }]}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('signin');
                  setErrorMsg(null);
                }}
              >
                <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
                  {isUrdu ? "شہری لاگ ان" : "Citizen Sign In"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('signup');
                  setErrorMsg(null);
                }}
              >
                <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                  {isUrdu ? "نیا اکاؤنٹ" : "Sign Up"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'authority' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('authority');
                  setErrorMsg(null);
                }}
              >
                <Text style={[styles.tabText, activeTab === 'authority' && styles.activeTabText]}>
                  {isUrdu ? "بلدیاتی ایڈمن" : "Zonal Authority"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={{ height: 2, backgroundColor: '#0F172A', marginBottom: 20 }} />

            {/* Error Message */}
            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Inputs */}
            {activeTab !== 'authority' ? (
              <View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { textAlign: textAlignStyle }]}>
                    {isUrdu ? "ای میل ایڈریس" : "Email Address"}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: textAlignStyle }]}
                    placeholder="email@example.com"
                    placeholderTextColor="rgba(15, 23, 42, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { textAlign: textAlignStyle }]}>
                    {isUrdu ? "پاس ورڈ" : "Password"}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: textAlignStyle }]}
                    placeholder={isUrdu ? "کم از کم 6 حروف" : "At least 6 characters"}
                    placeholderTextColor="rgba(15, 23, 42, 0.4)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.inputLabel, { textAlign: textAlignStyle }]}>
                  🏢 {isUrdu ? "بلدیاتی ٹاؤن منتخب کریں:" : "Select Zonal Town / TMC:"}
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

                <Text style={[styles.inputLabel, { textAlign: textAlignStyle, marginTop: 4 }]}>
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

                {/* Display Representative Information */}
                {(() => {
                  const townObj = KARACHI_TOWNS.find(t => t.name === selectedTown);
                  const ucObj = townObj?.ucs.find(u => `${u.ucNo} ${u.name}` === selectedUC);
                  if (!ucObj) return null;
                  return (
                    <View style={styles.repInfoBox}>
                      <Text style={styles.repTitle}>👤 {isUrdu ? "سرکاری کونسل سربراہ:" : "Elected UC Chairman:"}</Text>
                      <Text style={styles.repName}>{ucObj.chairman}</Text>
                      <Text style={styles.repContact}>{isUrdu ? "رابطہ:" : "Phone:"} {ucObj.contact || 'N/A'}</Text>
                      <Text style={styles.repEmail}>{ucObj.email}</Text>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Primary Action Button */}
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleAuthAction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {activeTab === 'signin' ? (isUrdu ? "لاگ ان کریں" : "Sign In") :
                   activeTab === 'signup' ? (isUrdu ? "نیا اکاؤنٹ بنائیں" : "Create Account") :
                   (isUrdu ? "ایڈمن پینل لاگ ان" : "Access Zonal Console")
                  }
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{isUrdu ? "یا" : "OR"}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Secondary Anonymous/Guest Button */}
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleGuestLogin}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                {isUrdu ? "مہمان کے طور پر شامل ہوں" : "Continue as Guest"}
              </Text>
            </TouchableOpacity>
            
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DFD1A5', // Sandstone Yellow
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBadge: {
    backgroundColor: '#1D6874', // Coastal Teal
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#1D6874',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#E6DAB2', // Darker Sandstone blocks
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
    marginBottom: 24,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 4,
    borderBottomColor: '#1D6874', // Active Coastal Teal underline
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  activeTabText: {
    color: '#1D6874',
  },
  errorBox: {
    backgroundColor: 'rgba(169, 68, 66, 0.1)',
    borderWidth: 1.5,
    borderColor: '#A94442',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#A94442',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#DFD1A5',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#065F46', // Civic Green
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#0F172A',
  },
  dividerText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  secondaryButton: {
    backgroundColor: '#A94442', // Terracotta Red
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  townBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#DFD1A5',
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
    fontSize: 12,
  },
  townBtnTextActive: {
    color: '#FFFFFF',
  },
  ucChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#DFD1A5',
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
    fontSize: 11,
  },
  ucChipTextActive: {
    color: '#FFFFFF',
  },
  repInfoBox: {
    backgroundColor: '#DFD1A5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    marginTop: 10,
  },
  repTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D6874',
    marginBottom: 4,
  },
  repName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  repContact: {
    fontSize: 12,
    color: '#0F172A',
    marginTop: 2,
    fontWeight: '500',
  },
  repEmail: {
    fontSize: 11,
    color: 'rgba(15, 23, 42, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
});
