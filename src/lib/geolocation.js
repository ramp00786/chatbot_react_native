import * as Location from 'expo-location';
import Constants from 'expo-constants';

// Get current location using Expo Location
export const getCurrentLocation = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission not granted, using default location');
      return {
        latitude: 18.5204, // Default to Pune
        longitude: 73.8567,
      };
    }

    let location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      latitude: 18.5204, // Default to Pune
      longitude: 73.8567,
    };
  }
};