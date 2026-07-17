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

// ─── Geçiş (Transaction) API Fonksiyonları ───

export interface NextActionResponse {
  suggestedType: 'GIRIS' | 'CIKIS';
  lastTransaction?: {
    type: 'GIRIS' | 'CIKIS';
    timestamp: string;
    locationName?: string;
  } | null;
}

export interface TransactionLogRequest {
  type: 'GIRIS' | 'CIKIS' | null;
  timestamp: string | null;
  latitude: number;
  longitude: number;
  qrContent: string | null;
  method: 'QR' | 'GPS';
  deviceId: string;
}

export interface TransactionLogResponse {
  id: number;
  type: 'GIRIS' | 'CIKIS';
  timestamp: string;
  locationName: string | null;
  message: string;
}

export interface TransactionHistoryItem {
  id: number;
  type: 'GIRIS' | 'CIKIS';
  timestamp: string;
  locationName: string | null;
  method: 'QR' | 'GPS';
}

export interface TransactionHistoryPage {
  content: TransactionHistoryItem[];
  totalPages: number;
  totalElements: number;
  last: boolean;
}

/**
 * GET /transaction/next-action
 * Son harekete göre giriş/çıkış önerisini alır.
 */
export async function getNextAction(token: string): Promise<NextActionResponse> {
  try {
    const response = await api.get<NextActionResponse>('/transaction/next-action', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? 'Durum bilgisi alınamadı.';
    throw new Error(message);
  }
}

/**
 * POST /transaction/log
 * Geçiş kaydı ekler.
 */
export async function logTransaction(
  token: string,
  body: TransactionLogRequest,
): Promise<TransactionLogResponse> {
  try {
    const response = await api.post<TransactionLogResponse>('/transaction/log', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      const mismatchError = new Error(
        error.response?.data?.message ?? 'Cihaz uyuşmazlığı hatası.',
      ) as any;
      mismatchError.isDeviceMismatch = true;
      throw mismatchError;
    }
    if (error.response?.status === 400 && error.response?.data?.errorCode === 'INVALID_QR') {
      const qrError = new Error(
        error.response?.data?.message ?? 'Geçersiz QR Kod.',
      ) as any;
      qrError.isInvalidQr = true;
      throw qrError;
    }
    const message = error.response?.data?.message ?? 'İşlem kaydı oluşturulamadı.';
    throw new Error(message);
  }
}

/**
 * GET /transaction/history
 * Geçiş geçmişini sayfalı olarak alır.
 */
export async function getHistory(
  token: string,
  page: number = 0,
  size: number = 20,
): Promise<TransactionHistoryPage> {
  try {
    const response = await api.get<TransactionHistoryPage>('/transaction/history', {
      params: {page, size},
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? 'Geçmiş listesi yüklenemedi.';
    throw new Error(message);
  }
}
