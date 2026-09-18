import React, { useState, useEffect } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, Keyboard, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Svg, { Path } from 'react-native-svg';
import { colors, radii, spacing } from '@/src/theme/colors';

const { width } = Dimensions.get('window');

interface AuthScreenProps extends React.PropsWithChildren {
  title: string;
  subtitle: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AuthScreen({ title, subtitle, children, showBack, onBack }: AuthScreenProps) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/auth-bg.png')} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Header Section */}
          <View style={styles.headerSection}>
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
              <View style={styles.brand}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              </View>
            </SafeAreaView>
          </View>

          {/* Main Content Card */}
          <View style={styles.contentSection}>
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              <View style={styles.body}>{children}</View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function FormMessage({ message, offline = false }: { message: string; offline?: boolean }) {
  return <View accessibilityRole="alert" style={[styles.message, offline && styles.offline]}><Text style={[styles.messageText, offline && styles.offlineText]}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // Header Styles
  headerSection: {
    width: '100%',
    minHeight: 220,
    position: 'relative',
  },
  headerSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  brand: { alignItems: 'center' },
  logo: { width: 150, height: 150 },

  // Content Styles
  contentSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    backgroundColor: 'rgba(253, 251, 247, 0.92)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: { color: '#660000', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { color: '#6B7280', fontSize: 15, lineHeight: 22, marginTop: spacing.xs, fontWeight: '400' },
  body: { marginTop: spacing.xl },

  message: { borderRadius: radii.sm, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', padding: 12, marginBottom: spacing.md },
  messageText: { color: '#991B1B', fontSize: 13, lineHeight: 18, fontWeight: '500', fontStyle: 'normal' },
  offline: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  offlineText: { color: '#92400E' },
});
