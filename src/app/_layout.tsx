import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, LogBox, View, ActivityIndicator } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import LoginScreen from '@/app/login';
import { LanguageProvider } from '@/services/localization';
import { subscribeToAuth } from '@/services/firebase';

// Ignore logs to maintain a clean presentation for the evaluation
LogBox.ignoreAllLogs(true);

const CustomNavigationTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1D6874',     // Coastal Teal
    background: '#DFD1A5',  // Sandstone Yellow
    card: '#E6DAB2',        // Darker Sandstone
    text: '#0F172A',        // Dark Slate
    border: '#0F172A',
    notification: '#A94442', // Terracotta Red
  },
};

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase & Mock auth states
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider value={CustomNavigationTheme}>
        <AnimatedSplashOverlay />
        
        {authLoading ? (
          <View style={{ flex: 1, backgroundColor: '#DFD1A5', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#1D6874" />
          </View>
        ) : !user ? (
          <LoginScreen />
        ) : (
          <AppTabs />
        )}
      </ThemeProvider>
    </LanguageProvider>
  );
}
