import React, { useRef, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { AuthScreen, FormMessage } from '@/src/components/AuthScreen';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { useAuth } from '@/src/context/AuthContext';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { colors, spacing } from '@/src/theme/colors';
import { toApiError } from '@/src/utils/axiosInstance';
import { type LoginErrors, validateLogin } from '@/src/utils/authValidation';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { user, isHydrating, signIn, signInWithGoogle } = useAuth();
  const { isOffline } = useNetworkStatus();
  const passwordRef = useRef<TextInput>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: keyof LoginErrors) => setErrors((current) => ({ ...current, [field]: undefined }));

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const id_token = response.params?.id_token || response.authentication?.idToken;
      if (id_token) {
        setLoading(true);
        signInWithGoogle({ credential: id_token })
          .then(() => router.replace('/'))
          .catch((error) => setSubmitError(toApiError(error).message))
          .finally(() => setLoading(false));
      } else {
        setSubmitError("Failed to get Google ID token");
      }
    } else if (response?.type === 'error') {
      setSubmitError(response.error ? String(response.error) : "Google sign in failed");
    }
  }, [response]);

  if (!isHydrating && user) return <Redirect href="/" />;

  const handleLogin = async () => {
    const validation = validateLogin(phoneNumber, password);
    setErrors(validation);
    setSubmitError('');
    if (Object.keys(validation).length || loading) return;
    if (isOffline) { setSubmitError('You are offline. Reconnect to sign in.'); return; }
    setLoading(true);
    try {
      await signIn({ phoneNumber: phoneNumber.trim(), password });
      router.replace('/');
    } catch (error) {
      setSubmitError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in securely to continue shopping.">
      {isOffline && <FormMessage offline message="No internet connection. You can sign in when your connection returns." />}
      {submitError && !isOffline && <FormMessage message={submitError} />}
      <Input 
        label="Phone Number" 
        placeholder="Enter 10-digit number" 
        value={phoneNumber} 
        error={errors.phoneNumber} 
        onChangeText={(value) => { setPhoneNumber(value); clearFieldError('phoneNumber'); setSubmitError(''); }} 
        keyboardType="phone-pad" 
        returnKeyType="next" 
        onSubmitEditing={() => passwordRef.current?.focus()} 
        leftIcon={<Ionicons name="call-outline" size={20} color="#9CA3AF" />}
      />
      <Input 
        ref={passwordRef} 
        label="Password" 
        placeholder="Enter your password" 
        value={password} 
        error={errors.password} 
        onChangeText={(value) => { setPassword(value); clearFieldError('password'); setSubmitError(''); }} 
        secureTextEntry 
        autoCapitalize="none" 
        autoCorrect={false} 
        autoComplete="current-password" 
        textContentType="password" 
        returnKeyType="done" 
        onSubmitEditing={handleLogin} 
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
      />
      <View style={styles.forgotPasswordContainer}>
        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      <Button title="Sign In" onPress={handleLogin} loading={loading} disabled={isOffline || isHydrating} />
      <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or continue with</Text><View style={styles.dividerLine} /></View>
      <Button title="Continue with Google" variant="secondary" icon={<Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }} style={{ width: 20, height: 20 }} />} onPress={() => promptAsync()} disabled={!request || loading || isOffline} />
      <View style={styles.footer}><Text style={styles.footerText}>New to Prabha Tex?</Text><Button title="Create Account" variant="text" onPress={() => router.push('/signup')} disabled={loading} /></View>
      <View style={styles.secureContainer}>
        <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
        <Text style={styles.secureText}>Secure sign in</Text>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: spacing.md, marginTop: -spacing.sm },
  forgotPasswordText: { color: '#660000', fontSize: 13, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textMuted, fontSize: 13, fontStyle: 'normal' },
  footer: { marginTop: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  footerText: { color: colors.textMuted, fontSize: 14, fontStyle: 'normal' },
  secureContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xxl, gap: spacing.xs },
  secureText: { color: '#6B7280', fontSize: 12, fontWeight: '500' }
});
