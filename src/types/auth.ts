export interface User {
  id: number;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  role: 'user' | 'admin';
}

export interface LoginPayload { phoneNumber: string; password: string }
export interface RegisterPayload { username: string; phoneNumber: string; email?: string; password: string; confirmPassword: string }
export interface AuthResponse { success: true; message: string; user: User; token: string }
export interface GoogleLoginPayload { credential: string }
