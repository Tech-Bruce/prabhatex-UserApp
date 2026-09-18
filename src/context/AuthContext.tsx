import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/src/services/auth.service';
import type { GoogleLoginPayload, LoginPayload, RegisterPayload, User } from '@/src/types/auth';
import { tokenStore } from '@/src/utils/axiosInstance';

interface AuthContextValue {
  user: User | null;
  isHydrating: boolean;
  signIn(payload: LoginPayload): Promise<void>;
  signInWithGoogle(payload: GoogleLoginPayload): Promise<void>;
  signUp(payload: RegisterPayload): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await tokenStore.hydrate();
        if (token) {
          const profile = await authService.profile();
          if (mounted) setUser(profile);
        }
      } catch {
        await tokenStore.clear();
      } finally {
        if (mounted) setIsHydrating(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    await tokenStore.save(response.token);
    setUser(response.user);
  }, []);

  const signInWithGoogle = useCallback(async (payload: GoogleLoginPayload) => {
    const response = await authService.googleLogin(payload);
    await tokenStore.save(response.token);
    setUser(response.user);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    await authService.register(payload);
    await signIn({ phoneNumber: payload.phoneNumber, password: payload.password });
  }, [signIn]);

  const signOut = useCallback(async () => {
    await authService.logout();
    await tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isHydrating, signIn, signInWithGoogle, signUp, signOut }), [user, isHydrating, signIn, signInWithGoogle, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
