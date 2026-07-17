import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {requestLocationPermission, getCurrentPosition} from '../services/location';

type Props = NativeStackScreenProps<RootStackParamList, 'GpsTransaction'>;

export default function GpsTransactionScreen({navigation}: Props) {
  const [status, setStatus] = useState<'requesting' | 'fetching' | 'error'>('requesting');

  const startGpsFlow = async () => {
    try {
      setStatus('requesting');
      const hasPerm = await requestLocationPermission();
      if (!hasPerm) {
        setStatus('error');
        return;
      }

      setStatus('fetching');
      const pos = await getCurrentPosition();

      // Konum alındı, onay ekranına yönlendir
      navigation.replace('ConfirmTransaction', {
        qrContent: null,
        latitude: pos.latitude,
        longitude: pos.longitude,
        method: 'GPS',
      });
    } catch (err) {
      console.error('GPS flow failed:', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    startGpsFlow();
  }, []);

  const openAppSettings = () => {
    Linking.openSettings();
  };

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>📍</Text>
          <Text style={styles.errorTitle}>Konumunuz Alınamıyor</Text>
          <Text style={styles.errorDescription}>
            Geçiş işlemi yapabilmek için yüksek doğruluklu GPS konum bilgisi gereklidir.
            Lütfen konum servislerinin açık ve uygulamaya konum izni verildiğinden emin olun.
          </Text>

          <TouchableOpacity style={styles.retryButton} onPress={startGpsFlow}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
            <Text style={styles.settingsButtonText}>Konum Ayarlarını Aç</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>İptal Et</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#9b59b6" />
      <Text style={styles.loadingText}>
        {status === 'requesting' ? 'Konum izni isteniyor...' : 'Konumunuz doğrulanıyor...'}
      </Text>
      <Text style={styles.subText}>Bu işlem birkaç saniye sürebilir.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 24,
  },
  subText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c0392b',
    marginBottom: 12,
  },
  errorDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    borderWidth: 1,
    borderColor: '#9b59b6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsButtonText: {
    color: '#9b59b6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
