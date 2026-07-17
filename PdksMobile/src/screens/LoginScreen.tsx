import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {login} from '../services/api';
import {saveToken, saveFullName} from '../services/auth';
import {
  getOrCreateDeviceId,
  getDeviceName,
  registerDevice,
} from '../services/device';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [firmId, setFirmId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Basit boş alan kontrolü
    if (!firmId.trim() || !username.trim() || !password.trim()) {
      setErrorMessage('Tüm alanları doldurunuz.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      // 1. Bu cihazın UUID'sini al (keychain'den veya DeviceInfo'dan)
      const deviceId = await getOrCreateDeviceId();

      // 2. Login isteği — backend'e deviceId de gönder
      const response = await login(
        firmId.trim(),
        username.trim(),
        password,
        deviceId,
      );

      // 3. Token'ı ve kullanıcı adını güvenli depoya kaydet
      await saveToken(response.token);
      await saveFullName(response.fullName);

      // 4. Cihaz bağlama kontrolü
      if (!response.deviceRegistered) {
        // İlk kez bu cihazdan giriş — cihazı kaydet
        try {
          await registerDevice(response.token);

          const deviceName = getDeviceName();
          Alert.alert(
            'Cihaz Kaydedildi',
            `${deviceName} cihazınız hesabınıza güvenli şekilde eşleştirildi. Bundan sonra giriş işlemleri yalnızca bu cihazdan yapılabilir.`,
            [
              {
                text: 'Tamam',
                onPress: () => navigateAfterLogin(response),
              },
            ],
          );
          return; // Alert kapandıktan sonra navigateAfterLogin çalışacak
        } catch {
          // Cihaz kayıt hatası — yine de devam et (retry sonraki girişte)
          navigateAfterLogin(response);
        }
      } else {
        // Cihaz zaten kayıtlı ve eşleşiyor — direkt devam
        navigateAfterLogin(response);
      }
    } catch (error: any) {
      // 403 DEVICE_MISMATCH → DeviceMismatch ekranına yönlendir
      if (error.isDeviceMismatch) {
        navigation.replace('DeviceMismatch');
        return;
      }
      setErrorMessage(error.message ?? 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateAfterLogin = (response: {
    mustChangePassword: boolean;
    fullName: string;
    token: string;
  }) => {
    if (response.mustChangePassword) {
      // İlk giriş — şifre değiştirme zorunlu
      navigation.replace('ChangePassword', {token: response.token});
    } else {
      // Normal giriş — ana ekrana git
      navigation.replace('Home', {
        fullName: response.fullName,
        token: response.token,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>PDKS Giriş</Text>

      <TextInput
        style={styles.input}
        placeholder="Firma ID"
        value={firmId}
        onChangeText={setFirmId}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {errorMessage !== '' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>GİRİŞ YAP</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
