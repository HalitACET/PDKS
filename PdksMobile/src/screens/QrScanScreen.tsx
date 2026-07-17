import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Camera, useCameraDevice, useCodeScanner, useCameraPermission} from 'react-native-vision-camera';
import {RootStackParamList} from '../navigation/AppNavigator';
import {requestLocationPermission, getCurrentPosition} from '../services/location';

type Props = NativeStackScreenProps<RootStackParamList, 'QrScan'>;

export default function QrScanScreen({navigation}: Props) {
  const {hasPermission: cameraPermission, requestPermission} = useCameraPermission();
  const [locationStatus, setLocationStatus] = useState<'fetching' | 'success' | 'error'>('fetching');
  const [coordinates, setCoordinates] = useState<{latitude: number; longitude: number} | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  
  const device = useCameraDevice('back');
  const scannedRef = useRef<boolean>(false);

  // 1. Kamera izni iste
  useEffect(() => {
    (async () => {
      if (!cameraPermission) {
        await requestPermission();
      }
    })();
  }, [cameraPermission]);

  // 2. Konum izni iste ve konumu al (TC03)
  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      setLocationStatus('fetching');
      const hasPerm = await requestLocationPermission();
      if (!hasPerm) {
        if (isMounted) setLocationStatus('error');
        return;
      }

      try {
        const pos = await getCurrentPosition();
        if (isMounted) {
          setCoordinates(pos);
          setLocationStatus('success');
        }
      } catch (err) {
        if (isMounted) setLocationStatus('error');
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. QR Kod tarama mantığı
  const handleQrScanned = (qrValue: string) => {
    if (scannedRef.current) return;

    if (locationStatus === 'fetching') {
      Alert.alert('Lütfen Bekleyin', 'Konumunuz henüz alınamadı, doğrulama sürüyor.');
      return;
    }

    if (locationStatus === 'error' || !coordinates) {
      Alert.alert('Konum Hatası', 'Geçerli bir GPS konumu alınamadığı için geçiş yapamazsınız (TC03).');
      return;
    }

    scannedRef.current = true;
    setIsCameraActive(false);

    // Başarıyla yönlendir
    navigation.navigate('ConfirmTransaction', {
      qrContent: qrValue,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      method: 'QR',
    });
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: any[]) => {
      if (codes.length > 0 && codes[0].value) {
        handleQrScanned(codes[0].value);
      }
    },
  });

  if (cameraPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Kamera izni kontrol ediliyor...</Text>
      </View>
    );
  }

  if (cameraPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Kamera izni reddedildi. QR taramak için kamera izni vermeniz gerekir.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Arka kamera bulunamadı.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isCameraActive}
        codeScanner={codeScanner}
      />

      <View style={styles.overlayContainer}>
        <View style={styles.scannerFrame} />
        
        <View style={styles.statusBox}>
          {locationStatus === 'fetching' && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#e67e22" style={{marginRight: 8}} />
              <Text style={[styles.statusText, {color: '#e67e22'}]}>Konum alınıyor...</Text>
            </View>
          )}

          {locationStatus === 'success' && (
            <Text style={[styles.statusText, {color: '#2ecc71'}]}>✓ Konum doğrulandı</Text>
          )}

          {locationStatus === 'error' && (
            <Text style={[styles.statusText, {color: '#e74c3c'}]}>✗ Konum alınamıyor (Tarama Engellendi)</Text>
          )}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>İptal Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3498db',
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginTop: 100,
  },
  statusBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
