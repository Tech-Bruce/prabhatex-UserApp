import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthScreen, FormMessage } from '@/src/components/AuthScreen';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { authService } from '@/src/services/auth.service';
import { spacing } from '@/src/theme/colors';
import { toApiError } from '@/src/utils/axiosInstance';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState<'PHONE' | 'VERIFY_AND_SET_PASSWORD'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    if (!phoneNumber || phoneNumber.trim().length !== 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(phoneNumber.trim());
      setStep('VERIFY_AND_SET_PASSWORD');
    } catch (err) {
      const msg = toApiError(err).message;
      setError(msg);
      Toast.show({ type: 'error', text1: 'Failed to send OTP', text2: msg, visibilityTime: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (otp.length < 6) { setError('Please enter a valid 6-digit code'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(phoneNumber.trim(), otp.trim(), newPassword);
      Toast.show({ type: 'success', text1: 'Password updated successfully' });
      router.replace('/login');
    } catch (err: any) {
      const msg = toApiError(err).message;
      setError(msg);
      Toast.show({ type: 'error', text1: 'Update failed', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen 
      title={step === 'PHONE' ? "Forgot password?" : "Create new password"} 
      subtitle={step === 'PHONE' ? "Enter your registered phone number and we'll send you a verification code." : "Enter the verification code and choose a secure password."}
    >
      {error ? <FormMessage message={error} /> : null}
      
      {step === 'PHONE' ? (
        <View>
          <View style={styles.graphicContainer}>
            <View style={styles.graphicCircle}>
              <Ionicons name="phone-portrait-outline" size={48} color="#850404" />
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <Input 
            label="Phone Number" 
            placeholder="Enter 10-digit number" 
            value={phoneNumber} 
            onChangeText={(val) => { setPhoneNumber(val); setError(''); }} 
            keyboardType="phone-pad" 
            leftIcon={<Text style={styles.countryCode}>+91</Text>}
          />
          <View style={styles.spacer} />
          <Button title="Send OTP" onPress={handleRequestOtp} loading={loading} />
          <View style={styles.secureContainer}>
            <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
            <Text style={styles.secureText}>Your number is used only for verification.</Text>
          </View>
        </View>
      ) : (
        <View>
          <Input 
            label="Verification Code" 
            placeholder="Enter 6-digit code" 
            value={otp} 
            onChangeText={(val) => { setOtp(val); setError(''); }} 
            keyboardType="number-pad" 
            maxLength={6}
          />
          <View style={styles.resendContainer}>
            <TouchableOpacity onPress={handleRequestOtp}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
          
          <Input 
            label="New Password" 
            placeholder="Minimum 8 characters" 
            value={newPassword} 
            onChangeText={(val) => { setNewPassword(val); setError(''); }} 
            secureTextEntry 
          />
          <Input 
            label="Confirm Password" 
            placeholder="Re-enter new password" 
            value={confirmPassword} 
            onChangeText={(val) => { setConfirmPassword(val); setError(''); }} 
            secureTextEntry 
          />
          <View style={styles.spacer} />
          <Button title="Update Password" onPress={handleUpdatePassword} loading={loading} />
        </View>
      )}

      <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back to Sign In</Text>
      </TouchableOpacity>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.lg },
  graphicContainer: { alignItems: 'center', marginVertical: spacing.xl },
  graphicCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 20,
    right: 25,
    backgroundColor: '#850404',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countryCode: { color: '#111827', fontSize: 16, fontWeight: '600' },
  secureContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg, gap: spacing.xs },
  secureText: { color: '#6B7280', fontSize: 12, fontWeight: '500' },
  resendContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.lg },
  resendText: { color: '#660000', fontSize: 12, fontWeight: '700' },
  backButton: { marginTop: spacing.xxl, alignItems: 'center' },
  backButtonText: { color: '#660000', fontSize: 14, fontWeight: '700' },
});
