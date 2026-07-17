import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceMismatch'>;

export default function DeviceMismatchScreen({navigation}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* İkon */}
      <Text style={styles.icon}>📵</Text>

      {/* Başlık */}
      <Text style={styles.title}>Bu cihaz kayıtlı değil</Text>

      {/* Açıklama */}
      <Text style={styles.description}>
        Hesabınız başka bir telefona kayıtlı. Güvenlik nedeniyle geçişler
        yalnızca kayıtlı cihazdan yapılabilir.
      </Text>

      {/* Ne yapmalıyım? */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>NE YAPMALIYIM?</Text>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Telefonunuz yenilendiyse İK birimine başvurun.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>
            İK cihaz kaydınızı sıfırladıktan sonra bu telefondan giriş
            yapabilirsiniz.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>
            Bu sırada geçişinizi kapı görevlisine yaptırabilirsiniz.
          </Text>
        </View>
      </View>

      {/* Geri dön butonu */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Login')}>
        <Text style={styles.buttonText}>GİRİŞ EKRANINA DÖN</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c0392b',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#c0392b',
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
