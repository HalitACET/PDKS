import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionSuccess'>;

export default function TransactionSuccessScreen({route, navigation}: Props) {
  const {type, timestamp, locationName} = route.params;

  // Format timestamp (HH:mm)
  const formatTime = (tsStr: string) => {
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

  // Format date (dd.MM.yyyy)
  const formatDate = (tsStr: string) => {
    try {
      const parts = tsStr.split('T');
      if (parts.length > 0) {
        const dateParts = parts[0].split('-');
        if (dateParts.length === 3) {
          return `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
        }
      }
    } catch (e) {
      // fallback
    }
    return '';
  };

  const isGiris = type === 'GIRIS';
  const successText = isGiris ? 'GİRİŞ YAPILDI' : 'ÇIKIŞ YAPILDI';
  const timeText = formatTime(timestamp);
  const dateText = formatDate(timestamp);
  const locationText = locationName ? `Konum: ${locationName}` : 'Konum: Doğrulandı (GPS)';

  const handleDone = () => {
    // HomeScreen'e geri dön (ve yığını temizle)
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkmarkCircle}>
          <Text style={styles.checkmarkIcon}>✓</Text>
        </View>

        <Text style={styles.successTitle}>{successText}</Text>
        
        <View style={styles.detailsCard}>
          <Text style={styles.timeLabel}>Saat</Text>
          <Text style={styles.timeVal}>{timeText}</Text>

          <Text style={styles.dateVal}>{dateText}</Text>

          <View style={styles.divider} />

          <Text style={styles.locationVal}>{locationText}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Ana Sayfaya Dön</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2ecc71', // yeşil arkaplan
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmarkIcon: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#bdc3c7',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timeVal: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 4,
  },
  dateVal: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    width: '100%',
    marginVertical: 16,
  },
  locationVal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  doneButtonText: {
    color: '#2ecc71',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
