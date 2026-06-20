import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';

export type Language = 'en' | 'ur';

export const translations = {
  en: {
    appName: "Fix Karachi",
    slogan: "Civic Action & Transparency Portal",
    dashboard: "Dashboard",
    report: "Report Issue",
    verify: "Verify Nearby",
    analytics: "Analytics",
    emergencyAlerts: "Emergency Alerts",
    noAnnouncements: "No active announcements",
    civicFeed: "Karachi Civic Feed",
    filterAll: "All Domains",
    filterCivic: "Civic Infra",
    filterUtilities: "Utilities",
    filterSafety: "Public Safety",
    filterTransport: "Transport",
    filterEnvironmental: "Environmental",
    reportedBy: "Reported by",
    statusPending: "Pending",
    statusVerified: "Verified",
    statusSpam: "Flagged Spam",
    statusResolved: "Resolved",
    votes: "Votes",
    verifyButton: "Verify",
    flagButton: "Flag Spam",
    resolveButton: "Mark Resolved",
    description: "Description",
    category: "Category",
    domain: "Domain",
    location: "Location",
    pothole: "Pothole / Road Damage",
    waterLeakage: "Water Leakage",
    gasLeakage: "Gas Leakage",
    streetLight: "Street Light Outage",
    garbage: "Garbage Pile / Waste Burning",
    sewerage: "Sewerage Overflow",
    powerCut: "Power Outage / Hanging Wires",
    encroachment: "Encroachment",
    publicTransit: "Public Transit Delay",
    other: "Other Incident",
    selectDomain: "Select Problem Domain",
    selectCategory: "Select Category",
    enterDescription: "Describe the issue in detail...",
    takePhoto: "Snap Photo",
    chooseGallery: "Choose from Gallery",
    submitting: "Submitting report...",
    submitSuccess: "Report submitted successfully! Offline cache synchronized.",
    submitError: "Failed to submit. Saved to offline queue.",
    gpsFetching: "Fetching GPS Coordinates...",
    gpsSuccess: "GPS Coordinates Captured",
    gpsError: "Could not fetch GPS. Using default location.",
    verificationDashboard: "Proximity Verification Dashboard",
    verificationSubtitle: "Upvote genuine issues. Downvote spam to keep Karachi's feed clean.",
    heatmapTitle: "Authority Intelligence Tracker",
    heatmapSubtitle: "Heatmap of verified issues for civic deployment",
    updateStatus: "Update Report Status",
    filterTitle: "Filter by Domain",
    submitReport: "Submit Report",
    anonymousUser: "Anonymous User",
    languageLabel: "اردو",
    toggleLanguage: "Switch to Urdu",
    requiredFields: "Please fill all required fields and select an image.",
    compressing: "Compressing image (Low-Bandwidth Sync)...",
    noReports: "No reports found in this domain.",
    verifiedBadge: "VERIFIED",
    pendingBadge: "PENDING",
    resolvedBadge: "RESOLVED",
    spamBadge: "SPAM",
  },
  ur: {
    appName: "فکس کراچی",
    slogan: "شہری ایکشن اور شفافیت پورٹل",
    dashboard: "ڈیش بورڈ",
    report: "شکایت درج کریں",
    verify: "تصدیق کریں",
    analytics: "تجزیہ",
    emergencyAlerts: "ہنگامی الرٹس",
    noAnnouncements: "کوئی فعال الرٹ نہیں ہے",
    civicFeed: "کراچی شہری فیڈ",
    filterAll: "تمام شعبے",
    filterCivic: "بلدیاتی ڈھانچہ",
    filterUtilities: "سہولیات",
    filterSafety: "عوامی تحفظ",
    filterTransport: "ٹرانسپورٹ",
    filterEnvironmental: "ماحولیاتی",
    reportedBy: "رپورٹ کنندہ",
    statusPending: "زیر التواء",
    statusVerified: "تصدیق شدہ",
    statusSpam: "اسپیم قرار",
    statusResolved: "حل شدہ",
    votes: "ووٹ",
    verifyButton: "تصدیق کریں",
    flagButton: "اسپیم بتائیں",
    resolveButton: "حل شدہ مارک کریں",
    description: "تفصیل",
    category: "زمرہ",
    domain: "شعبہ",
    location: "مقام",
    pothole: "سڑک کی خرابی / گڑھا",
    waterLeakage: "پانی کا اخراج",
    gasLeakage: "گیس کا اخراج",
    streetLight: "اسٹریٹ لائٹ کی خرابی",
    garbage: "کچرے کا ڈھیر / جلانا",
    sewerage: "سیوریج کا بہاؤ",
    powerCut: "بجلی کی بندش / لٹکتی تاریں",
    encroachment: "تجاوزات",
    publicTransit: "پبلک ٹرانسپورٹ تاخیر",
    other: "دیگر مسئلہ",
    selectDomain: "مسئلہ کا شعبہ منتخب کریں",
    selectCategory: "زمرہ منتخب کریں",
    enterDescription: "تفصیل سے مسئلہ بیان کریں...",
    takePhoto: "تصویر لیں",
    chooseGallery: "گیلری سے منتخب کریں",
    submitting: "رپورٹ جمع ہو رہی ہے...",
    submitSuccess: "رپورٹ کامیابی کے ساتھ جمع ہو گئی! آف لائن کیش ہم آہنگ ہو گیا۔",
    submitError: "جمع کرنے میں ناکامی۔ آف لائن قطار میں محفوظ کر لیا گیا۔",
    gpsFetching: "جی پی ایس کوآرڈینیٹس حاصل ہو رہے ہیں...",
    gpsSuccess: "جی پی ایس کوآرڈینیٹس محفوظ کر لیے گئے",
    gpsError: "جی پی ایس حاصل نہیں ہو سکا۔ ڈیفالٹ مقام استعمال ہو رہا ہے۔",
    verificationDashboard: "قریبی مسائل کی تصدیق کا ڈیش بورڈ",
    verificationSubtitle: "اصلی مسائل کی تصدیق کریں۔ اسپیم کو ختم کر کے کراچی کی فیڈ صاف رکھیں۔",
    heatmapTitle: "سول اتھارٹی انٹیلی جنس ٹریکر",
    heatmapSubtitle: "ترقیاتی کاموں کے لیے تصدیق شدہ مسائل کا نقشہ",
    updateStatus: "رپورٹ کی صورتحال تبدیل کریں",
    filterTitle: "شعبہ کے لحاظ سے فلٹر کریں",
    submitReport: "رپورٹ جمع کریں",
    anonymousUser: "گمنام صارف",
    languageLabel: "English",
    toggleLanguage: "انگلش میں تبدیل کریں",
    requiredFields: "براہ کرم تمام مطلوبہ فیلڈز پُر کریں اور تصویر منتخب کریں۔",
    compressing: "تصویر کمپریس ہو رہی ہے (کم بینڈوتھ مطابقت)...",
    noReports: "اس شعبے میں کوئی رپورٹ نہیں ملی۔",
    verifiedBadge: "تصدیق شدہ",
    pendingBadge: "زیر التواء",
    resolvedBadge: "حل شدہ",
    spamBadge: "اسپیم",
  }
};

interface LanguageContextProps {
  language: Language;
  t: typeof translations['en'];
  setLanguage: (lang: Language) => void;
  isUrdu: boolean;
  flexDirectionStyle: 'row' | 'row-reverse';
  textAlignStyle: 'left' | 'right';
  alignItemsStyle: 'flex-start' | 'flex-end';
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (Platform.OS !== 'web') {
      try {
        I18nManager.forceRTL(lang === 'ur');
      } catch (err) {
        console.warn("RTL force failed:", err);
      }
    }
  };

  const isUrdu = language === 'ur';
  const flexDirectionStyle = isUrdu ? 'row-reverse' as const : 'row' as const;
  const textAlignStyle = isUrdu ? 'right' as const : 'left' as const;
  const alignItemsStyle = isUrdu ? 'flex-end' as const : 'flex-start' as const;

  const value = {
    language,
    t: translations[language],
    setLanguage,
    isUrdu,
    flexDirectionStyle,
    textAlignStyle,
    alignItemsStyle
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
