import * as Keychain from 'react-native-keychain';

// Keychain'de kullanılacak sabit servis adı
const SERVICE_NAME = 'pdks_auth_token';

/**
 * JWT token'ı güvenli keychain'e yazar.
 * username alanına 'token' sabit değerini, password alanına token'ı kaydeder.
 */
export async function saveToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('token', token, {
    service: SERVICE_NAME,
  });
}

/**
 * Keychain'den JWT token'ı okur.
 * Token yoksa null döner.
 */
export async function getToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: SERVICE_NAME,
  });
  if (credentials) {
    return credentials.password; // password alanında token saklanıyor
  }
  return null;
}

/**
 * Keychain'den JWT token'ı siler (çıkış yapma).
 */
export async function removeToken(): Promise<void> {
  await Keychain.resetGenericPassword({service: SERVICE_NAME});
}
