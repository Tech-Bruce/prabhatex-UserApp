import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { AuthScreen, FormMessage } from '@/src/components/AuthScreen';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { useAuth } from '@/src/context/AuthContext';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { authService } from '@/src/services/auth.service';
import { colors, spacing } from '@/src/theme/colors';
import { toApiError } from '@/src/utils/axiosInstance';
import { type SignupErrors, validateSignup } from '@/src/utils/authValidation';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { user, isHydrating, signUp, signInWithGoogle } = useAuth();
  const { isOffline } = useNetworkStatus();
  const phoneNumberRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<SignupErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: keyof SignupErrors) => setErrors((current) => ({ ...current, [field]: undefined }));

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

  const handleSignup = async () => {
    const validation = validateSignup(username, phoneNumber, password, confirmPassword);
    setErrors(validation);
    setSubmitError('');
    if (Object.keys(validation).length || loading) return;
    if (isOffline) { setSubmitError('You are offline. Reconnect to create your account.'); return; }
    const normalizedPhone = phoneNumber.trim();
    setLoading(true);
    try {
      await signUp({ username: username.trim(), phoneNumber: normalizedPhone, password, confirmPassword });
      router.replace('/');
    } catch (error) {
      setSubmitError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Create your account" subtitle="A few details and you’re ready to shop.">
      {isOffline && <FormMessage offline message="No internet connection. Reconnect to create an account." />}
      {submitError && !isOffline && <FormMessage message={submitError} />}
      <Input 
        label="Full Name" 
        placeholder="Enter your full name" 
        value={username} 
        error={errors.username} 
        onChangeText={(value) => { setUsername(value); clearFieldError('username'); }} 
        autoComplete="name" 
        textContentType="name" 
        returnKeyType="next" 
        onSubmitEditing={() => phoneNumberRef.current?.focus()} 
        leftIcon={<Ionicons name="person-outline" size={20} color="#9CA3AF" />}
      />
      <Input 
        ref={phoneNumberRef} 
        label="Phone Number" 
        placeholder="Enter 10-digit number" 
        value={phoneNumber} 
        error={errors.phoneNumber} 
        onChangeText={(value) => { setPhoneNumber(value); clearFieldError('phoneNumber'); }} 
        keyboardType="phone-pad" 
        returnKeyType="next" 
        onSubmitEditing={() => passwordRef.current?.focus()} 
        leftIcon={<Ionicons name="call-outline" size={20} color="#9CA3AF" />}
      />
      <Input 
        ref={passwordRef} 
        label="Password" 
        placeholder="Minimum 8 characters" 
        value={password} 
        error={errors.password} 
        onChangeText={(value) => { setPassword(value); clearFieldError('password'); }} 
        secureTextEntry 
        autoCapitalize="none" 
        autoCorrect={false} 
        autoComplete="new-password" 
        textContentType="newPassword" 
        returnKeyType="next" 
        onSubmitEditing={() => confirmRef.current?.focus()} 
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
      />
      <View style={styles.passwordChecklist}>
        <Ionicons name="checkmark-circle" size={16} color={password.length >= 8 ? "#16A34A" : "#D1D5DB"} />
        <Text style={[styles.checklistText, password.length >= 8 && styles.checklistTextActive]}>8+ characters</Text>
        <Ionicons name="checkmark-circle" size={16} color={/\d/.test(password) ? "#16A34A" : "#D1D5DB"} style={{ marginLeft: spacing.md }} />
        <Text style={[styles.checklistText, /\d/.test(password) && styles.checklistTextActive]}>1 number</Text>
      </View>
      <Input 
        ref={confirmRef} 
        label="Confirm Password" 
        placeholder="Re-enter your password" 
        value={confirmPassword} 
        error={errors.confirmPassword} 
        onChangeText={(value) => { setConfirmPassword(value); clearFieldError('confirmPassword'); }} 
        secureTextEntry 
        autoCapitalize="none" 
        autoCorrect={false} 
        autoComplete="new-password" 
        textContentType="newPassword" 
        returnKeyType="done" 
        onSubmitEditing={handleSignup} 
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
      />
      <View style={styles.termsContainer}>
        <Ionicons name="checkbox" size={20} color="#850404" />
        <Text style={styles.terms}>I agree to the <Text style={styles.termsLink}>Terms & Privacy Policy</Text></Text>
      </View>
      <Button title="Create Account" onPress={handleSignup} loading={loading} disabled={isOffline || isHydrating} />
      <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or continue with</Text><View style={styles.dividerLine} /></View>
      <Button title="Continue with Google" variant="secondary" icon={<Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }} style={{ width: 20, height: 20 }} />} onPress={() => promptAsync()} disabled={!request || loading || isOffline} />
      <View style={styles.footer}><Text style={styles.footerText}>Already have an account?</Text><Button title="Sign In" variant="text" onPress={() => router.replace('/login')} disabled={loading} /></View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  passwordChecklist: { flexDirection: 'row', alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  checklistText: { color: '#9CA3AF', fontSize: 12, marginLeft: 4, fontWeight: '500' },
  checklistTextActive: { color: '#16A34A' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  terms: { color: '#6B7280', fontSize: 13, marginLeft: spacing.sm, fontStyle: 'normal' },
  termsLink: { color: '#850404', fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textMuted, fontSize: 13, fontStyle: 'normal' },
  footer: { marginTop: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  footerText: { color: colors.textMuted, fontSize: 14, fontStyle: 'normal' },
});
