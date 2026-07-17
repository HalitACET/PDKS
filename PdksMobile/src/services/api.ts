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
}

/**
 * POST /auth/login
 * firmId + username + password ile giriş yapar.
 * Başarısızsa backend 401 + {message} döner — axios bunu throw eder.
 */
export async function login(
  firmId: string,
  username: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      firmId,
      username,
      password,
    });
    return response.data;
  } catch (error: any) {
    // Backend'den gelen hata mesajını yakala, yoksa genel mesaj
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
