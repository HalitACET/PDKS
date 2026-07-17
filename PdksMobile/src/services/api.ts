import axios from 'axios';
import {API_BASE_URL} from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Auth API Fonksiyonları ───────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
  deviceRegistered: boolean;
}

/**
 * POST /auth/login
 * firmId + username + password + deviceId ile giriş yapar.
 * 403 DEVICE_MISMATCH durumunda özel hata fırlatır.
 */
export async function login(
  firmId: string,
  username: string,
  password: string,
  deviceId: string,
): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      firmId,
      username,
      password,
      deviceId,
    });
    return response.data;
  } catch (error: any) {
    // 403 DEVICE_MISMATCH → özel hata tipi
    if (error.response?.status === 403) {
      const deviceError = new Error(
        error.response?.data?.message ??
          'Bu hesap başka bir cihaza kayıtlıdır.',
      ) as any;
      deviceError.isDeviceMismatch = true;
      throw deviceError;
    }
    // Diğer hatalar
    const message =
      error.response?.data?.message ?? 'Sunucuya bağlanılamadı.';
    throw new Error(message);
  }
}

/**
 * POST /auth/change-password
 * Eski + yeni şifreyi gönderir, JWT token header'a eklenir.
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
  token: string,
): Promise<void> {
  try {
    await api.post(
      '/auth/change-password',
      {oldPassword, newPassword},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error: any) {
    const message =
      error.response?.data?.message ?? 'Şifre değiştirilemedi.';
    throw new Error(message);
  }
}
