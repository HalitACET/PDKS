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
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {changePassword} from '../services/api';
import {getToken} from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({navigation, route}: Props) {
  const {token} = route.params;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    setErrorMessage('');

    // Basit doğrulama
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Tüm alanları doldurunuz.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setErrorMessage('Yeni şifre en az bir rakam içermelidir.');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(oldPassword, newPassword, token);

      // Şifre değişti — token hâlâ geçerli, Home'a yönlendir
      // fullName'i bilmiyoruz ama token'dan alınamıyor; boş bırak, ileride çözülür
      navigation.replace('Home', {fullName: '', token});
    } catch (error: any) {
      setErrorMessage(error.message ?? 'Şifre değiştirilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Şifre Değiştir</Text>
      <Text style={styles.subtitle}>
        İlk girişinizde şifrenizi değiştirmeniz zorunludur.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Mevcut Şifre"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Yeni Şifre (min. 8 karakter, en az 1 rakam)"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Yeni Şifre Tekrar"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {errorMessage !== '' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleChangePassword}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>KAYDET</Text>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
