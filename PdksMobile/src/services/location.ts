import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';

/**
 * Konum izni ister. Android için ACCESS_FINE_LOCATION kontrol edilir.
 * İzin verilirse true, verilmezse false döner.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    const status = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (status === RESULTS.GRANTED) {
      return true;
    }
    const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Location permission request failed:', error);
    return false;
  }
}

export function getCurrentPosition(): Promise<{latitude: number; longitude: number}> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation high accuracy failed, trying low accuracy fallback...', error);
        
        // Yüksek doğruluk (GPS) başarısız olursa, hücresel/wifi üzerinden konum almayı dene
        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error2) => {
            console.error('Geolocation fallback low accuracy also failed:', error2);
            reject(new Error('LOCATION_UNAVAILABLE'));
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 10000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000, // 8 saniye GPS için bekle
        maximumAge: 5000,
      }
    );
  });
}
