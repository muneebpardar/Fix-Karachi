import { Platform } from 'react-native';
import * as Location from 'expo-location';

// Default to Karachi Civic Centre coordinates
export const KARACHI_CENTER = {
  latitude: 24.8922,
  longitude: 67.0747,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<GeoCoords> {
  // If we are on Web, use navigator.geolocation
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("Browser geolocation failed, using Karachi center:", error);
            resolve({ latitude: KARACHI_CENTER.latitude, longitude: KARACHI_CENTER.longitude });
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
        );
      } else {
        resolve({ latitude: KARACHI_CENTER.latitude, longitude: KARACHI_CENTER.longitude });
      }
    });
  }

  // On Native (Android/iOS), use expo-location
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied, using default Karachi coordinates.');
      return { latitude: KARACHI_CENTER.latitude, longitude: KARACHI_CENTER.longitude };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.warn('Error fetching location via Expo, using Karachi coordinates:', error);
    return { latitude: KARACHI_CENTER.latitude, longitude: KARACHI_CENTER.longitude };
  }
}
