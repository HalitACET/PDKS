import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useIsFocused} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import {removeToken, getFullName, getToken} from '../services/auth';
import {getNextAction, NextActionResponse} from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({navigation}: Props) {
  const isFocused = useIsFocused();
  const [fullName, setFullName] = useState<string>('');
  const [nextAction, setNextAction] = useState<NextActionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Get full name
      const name = await getFullName();
      setFullName(name || 'Personel');

      // 2. Get next action
      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }
      const data = await getNextAction(token);
      setNextAction(data);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    await removeToken();
    navigation.replace('Login');
  };

  // Helper to format time (HH:mm) from LocalDateTime string
  const formatTime = (tsStr?: string) => {
    if (!tsStr) return '';
    try {
      const parts = tsStr.split('T');
      if (parts.length > 1) {
        return parts[1].substring(0, 5);
      }
    } catch (e) {
      // fallback
    }
    return '';
  };

  const renderStatusCard = () => {
    if (loading) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="small" color="#3498db" />
        </View>
      );
    }

    const isInside = nextAction?.suggestedType === 'CIKIS';
    const cardStyle = isInside ? styles.insideCard : styles.outsideCard;
    const statusText = isInside ? 'İÇERİDESİNİZ' : 'DIŞARIDASINIZ';

    const last = nextAction?.lastTransaction;
    let lastText = 'Henüz geçiş kaydı yok';
    if (last) {
      const typeText = last.type === 'GIRIS' ? 'Giriş' : 'Çıkış';
      const timeText = formatTime(last.timestamp);
      const locText = last.locationName || 'GPS';
      lastText = `Son hareket: ${typeText} · ${timeText} · ${locText}`;
    }

    return (
      <View style={[styles.card, cardStyle]}>
        <Text style={styles.statusLabel}>Mevcut Durum</Text>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.lastText}>{lastText}</Text>
      </View>
    );
  };

  const actionText = nextAction?.suggestedType === 'CIKIS' ? 'ÇIKIŞ' : 'GİRİŞ';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Hoş geldin, {'\n'}
            <Text style={styles.nameText}>{fullName}</Text>
          </Text>
        </View>

        {renderStatusCard()}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.qrButton]}
            disabled={loading}
            onPress={() => navigation.navigate('QrScan')}
          >
            <Text style={styles.actionButtonText}>QR İLE {actionText}</Text>
            <Text style={styles.actionSubtext}>Kamerayı açarak QR kodu tarayın</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.gpsButton]}
            disabled={loading}
            onPress={() => navigation.navigate('GpsTransaction')}
          >
            <Text style={styles.actionButtonText}>KONUM İLE {actionText}</Text>
            <Text style={styles.actionSubtext}>GPS konumunuzu doğrulayın</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
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
  header: {
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  card: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 20,
  },
  loadingCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  insideCard: {
    backgroundColor: '#2ecc71',
  },
  outsideCard: {
    backgroundColor: '#34495e',
  },
  statusLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  lastText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qrButton: {
    backgroundColor: '#3498db',
  },
  gpsButton: {
    backgroundColor: '#9b59b6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
    marginBottom: 16,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
