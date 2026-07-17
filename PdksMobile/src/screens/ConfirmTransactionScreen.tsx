import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {getToken} from '../services/auth';
import {getOrCreateDeviceId} from '../services/device';
import {getNextAction, logTransaction} from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmTransaction'>;

export default function ConfirmTransactionScreen({route, navigation}: Props) {
  const {qrContent, latitude, longitude, method} = route.params;

  const [type, setType] = useState<'GIRIS' | 'CIKIS' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // 1. Saat ve tarih güncelle
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(timeStr);

      const dateStr = now.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setCurrentDate(dateStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. NextAction önerisini yükle
  useEffect(() => {
    const loadSuggestion = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) {
          navigation.replace('Login');
          return;
        }
        const nextAction = await getNextAction(token);
        setType(nextAction.suggestedType);
      } catch (err) {
        console.error('Failed to load transaction suggestion:', err);
        // Varsayılan olarak GIRIS seç
        setType('GIRIS');
      } finally {
        setLoading(false);
      }
    };

    loadSuggestion();
  }, []);

  const handleToggleType = () => {
    setType(prev => (prev === 'GIRIS' ? 'CIKIS' : 'GIRIS'));
  };

  const handleConfirm = async () => {
    if (!type) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const deviceId = await getOrCreateDeviceId();

      const response = await logTransaction(token, {
        type,
        timestamp: null, // sunucuda LocalDateTime.now() atanacak
        latitude,
        longitude,
        qrContent,
        method,
        deviceId,
      });

      // Başarılı ekranına yönlendir
      navigation.replace('TransactionSuccess', {
        type: response.type,
        timestamp: response.timestamp,
        locationName: response.locationName,
      });
    } catch (error: any) {
      console.error('Transaction log failed:', error);

      if (error.isDeviceMismatch) {
        // Cihaz uyuşmazlığı ekranına yönlendir
        navigation.replace('DeviceMismatch');
      } else if (error.isInvalidQr) {
        Alert.alert('Geçersiz İşlem', 'Okutulan QR kod bu firmaya ait değil veya geçersizdir.');
        navigation.goBack();
      } else {
        Alert.alert('Hata', error.message || 'Geçiş işlemi gerçekleştirilemedi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>İşlem detayları hazırlanıyor...</Text>
      </View>
    );
  }

  const isGiris = type === 'GIRIS';
  const typeText = isGiris ? 'GİRİŞ' : 'ÇIKIŞ';
  const colorTheme = isGiris ? '#3498db' : '#2ecc71';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.titleLabel}>PLANLANAN HAREKET</Text>
          <Text style={[styles.typeText, {color: colorTheme}]}>{typeText}</Text>
          
          <TouchableOpacity style={styles.toggleLink} onPress={handleToggleType}>
            <Text style={[styles.toggleLinkText, {color: colorTheme}]}>
              {isGiris ? 'Çıkış Yapmak İstiyorum' : 'Giriş Yapmak İstiyorum'} (Değiştir)
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.dateText}>{currentDate}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Yöntem:</Text>
            <Text style={styles.infoValue}>{method === 'QR' ? 'QR Kod Okuyucu' : 'GPS Konum Doğrulama'}</Text>
            
            <Text style={styles.infoLabel}>Koordinatlar:</Text>
            <Text style={styles.infoValue}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.confirmButton, {backgroundColor: colorTheme}]}
            disabled={submitting}
            onPress={handleConfirm}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {typeText === 'GİRİŞ' ? 'GİRİŞİ ONAYLA' : 'ÇIKIŞI ONAYLA'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            disabled={submitting}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>İptal Et</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  titleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#bdc3c7',
    letterSpacing: 1.5,
  },
  typeText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  toggleLink: {
    paddingVertical: 8,
  },
  toggleLinkText: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    width: '100%',
    marginVertical: 20,
  },
  timeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 4,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#bdc3c7',
    fontWeight: 'bold',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
    marginTop: 2,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
