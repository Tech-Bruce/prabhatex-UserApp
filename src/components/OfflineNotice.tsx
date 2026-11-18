import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { colors, radii, spacing } from '@/src/theme/colors';

interface OfflineNoticeProps {
  forceShow?: boolean;
}

const { width } = Dimensions.get('window');

export function OfflineNotice({ forceShow = false }: OfflineNoticeProps) {
  const netInfo = useNetInfo();
  const [retrying, setRetrying] = useState(false);

  const isOffline =
    forceShow ||
    (netInfo.isConnected === false || (netInfo.isConnected === true && netInfo.isInternetReachable === false));

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      setRetrying(false);
    }
  };

  if (!isOffline) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Brand Accent */}
          <View style={styles.topAccent} />

          {/* Central Hero Section */}
          <View style={styles.content}>
            {/* Visual Icon Illustration */}
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircleMid}>
                <View style={styles.iconCircleInner}>
                  <Ionicons name="cloud-offline" size={44} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Corporate Badge */}
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connection Offline</Text>
            </View>

            {/* Primary Heading */}
            <Text style={styles.heading}>Bring Your Network Online</Text>

            {/* Descriptive Body Copy */}
            <Text style={styles.subheading}>
              We are unable to connect to our servers. Check your Wi-Fi or cellular network settings to continue browsing our collections.
            </Text>

            {/* Practical Troubleshooting Steps */}
            <View style={styles.checklistCard}>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.checkItemText}>Ensure Mobile Data or Wi-Fi is toggled on</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.checkItemText}>Verify Airplane mode is deactivated</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.checkItemText}>Check signal strength or router connectivity</Text>
              </View>
            </View>
          </View>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.retryButton, retrying && styles.retryButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.retryButtonText}>Try Reconnecting</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Luxury warm background
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    position: 'relative',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  iconCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(122, 16, 16, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircleMid: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(122, 16, 16, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F1ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.error,
    marginRight: 7,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: spacing.xl,
  },
  checklistCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkItemText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1EFEA',
    marginVertical: 6,
  },
  footer: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radii.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
