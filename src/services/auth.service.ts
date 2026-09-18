import { axiosInstance } from '@/src/utils/axiosInstance';
import type { AuthResponse, GoogleLoginPayload, LoginPayload, RegisterPayload, User } from '@/src/types/auth';

export const authService = {
  async login(payload: LoginPayload) {
    const response = await axiosInstance.post<AuthResponse>('/login', payload);
    const data = response.data;
    
    // Extract token from Set-Cookie header since backend doesn't send it in JSON
    let token = data.token;
    if (!token && response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split(';')[0].split('=')[1];
      }
    }
    
    if (!token || !data.user) throw new Error('The server returned an invalid login response.');
    return { ...data, token };
  },
  async googleLogin(payload: GoogleLoginPayload) {
    const response = await axiosInstance.post<AuthResponse>('/google', payload);
    const data = response.data;
    
    let token = data.token;
    if (!token && response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split(';')[0].split('=')[1];
      }
    }
    
    if (!token || !data.user) throw new Error('The server returned an invalid login response.');
    return { ...data, token };
  },
  async register(payload: RegisterPayload) {
    const { data } = await axiosInstance.post<{ success: true; message: string; user: User }>('/register', payload);
    return data;
  },
  async profile() {
    const { data } = await axiosInstance.get<{ success: true; user: User }>('/profile');
    return data.user;
  },
  async logout() { await axiosInstance.post('/logout').catch(() => undefined); },
  async forgotPassword(phoneNumber: string) {
    const { data } = await axiosInstance.post<{ success: true; message: string }>('/forgot-password', { phoneNumber });
    return data;
  },
  async verifyOtp(phoneNumber: string, otp: string) {
    const { data } = await axiosInstance.post<{ success: true; message: string }>('/verify-otp', { phoneNumber, otp });
    return data;
  },
  async resetPassword(phoneNumber: string, otp: string, newPassword: string) {
    const { data } = await axiosInstance.post<{ success: true; message: string }>('/reset-password', { phoneNumber, otp, newPassword });
    return data;
  },
};
