import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Platform, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme/colors';
import { GoogleIcon } from './GoogleIcon';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'google';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({ 
  title, 
  loading = false, 
  variant = 'primary', 
  icon,
  style, 
  disabled, 
  ...rest 
}: ButtonProps) => {
  
  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
      case 'text':
        return styles.outlineText;
      case 'google':
        return styles.googleText;
      case 'secondary':
        return styles.secondaryText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const resolvedIcon = icon ? icon : (variant === 'google' ? <GoogleIcon size={20} /> : null);

  const content = loading ? (
    <ActivityIndicator color={variant === 'google' ? '#4285F4' : (variant === 'outline' || variant === 'text' ? colors.primary : colors.white)} />
  ) : (
    <>
      <View style={styles.contentRow}>
        {resolvedIcon && <View style={styles.iconContainer}>{resolvedIcon}</View>}
        <Text style={[styles.text, getTextStyle()]}>{title}</Text>
      </View>
      {variant === 'google' && (
        <View style={styles.googleColorBar} pointerEvents="none">
          <View style={[styles.googleColorSegment, { backgroundColor: '#4285F4' }]} />
          <View style={[styles.googleColorSegment, { backgroundColor: '#EA4335' }]} />
          <View style={[styles.googleColorSegment, { backgroundColor: '#FBBC05' }]} />
          <View style={[styles.googleColorSegment, { backgroundColor: '#34A853' }]} />
        </View>
      )}
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      style={({ pressed }) => [
        styles.container, 
        variant !== 'primary' && getContainerStyle(variant),
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        variant === 'primary' && { padding: 0, borderWidth: 0, backgroundColor: 'transparent' }, 
        style
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryGradientContainer}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
};

const getContainerStyle = (variant: string) => {
  switch (variant) {
    case 'google': return styles.googleContainer;
    case 'secondary': return styles.secondaryContainer;
    case 'outline': return styles.outlineContainer;
    case 'text': return styles.textContainer;
    default: return {};
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  primaryGradientContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  googleContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
  },
  googleColorBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: 'row',
  },
  googleColorSegment: {
    flex: 1,
    height: '100%',
  },
  secondaryContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  textContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    minHeight: 0,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.white,
    fontSize: 18,
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  googleText: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  textText: {
    color: '#660000',
    fontWeight: '700',
  },
  outlineText: {
    color: '#660000',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 12,
  }
});

