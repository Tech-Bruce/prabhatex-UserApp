import { create, isAxiosError, type AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'prabhatex_access_token';
// Using the host's local IP address so it works on both physical devices and emulators:
// export const API_URL = 'http://10.93.111.50:8080/api/v1';
export const API_URL = 'https://api.prabhatex.in/api/v1';
let accessToken: string | null = null;

export interface ApiError { message: string; status?: number; code?: string }

export const tokenStore = {
  async hydrate() { accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY); return accessToken; },
  async save(token: string) {
    accessToken = token;
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  },
  async clear() { accessToken = null; await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); },
  get() { return accessToken; },
};

export const axiosInstance = create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Client-Platform': 'mobile' },
});

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export const toApiError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: any[] }>;
    
    // No response at all — network issue or timeout
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return { message: 'Request timed out. Please try again.', code: axiosError.code };
      }
      return { message: 'Unable to connect. Please check your internet connection.', code: axiosError.code };
    }
    
    const data = axiosError.response.data;
    
    // Try to extract a human-readable message from the response body
    const serverMessage =
      (typeof data === 'object' && data !== null)
        ? (data.message || data.error || (data.errors?.[0]?.message))
        : null;
    
    // If we got a proper message from server, use it
    if (serverMessage && typeof serverMessage === 'string') {
      return { message: serverMessage, status: axiosError.response.status, code: axiosError.code };
    }
    
    // Fallback by HTTP status code
    const status = axiosError.response.status;
    if (status === 404) return { message: 'This phone number is not registered.', status, code: axiosError.code };
    if (status === 401) return { message: 'Unauthorized. Please log in again.', status, code: axiosError.code };
    if (status === 429) return { message: 'Too many attempts. Please wait a moment and try again.', status, code: axiosError.code };
    if (status >= 500) return { message: 'Server error. Please try again later.', status, code: axiosError.code };
    
    return { message: 'Something went wrong. Please try again.', status, code: axiosError.code };
  }
  return { message: error instanceof Error ? error.message : 'Something went wrong. Please try again.' };
};

export default axiosInstance;
