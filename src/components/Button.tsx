import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Platform, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme/colors';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
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
      case 'secondary':
        return styles.secondaryText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const content = loading ? (
    <ActivityIndicator color={variant === 'outline' || variant === 'text' ? colors.primary : colors.white} />
  ) : (
    <View style={styles.contentRow}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, getTextStyle()]}>{title}</Text>
    </View>
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
  },
  primaryGradientContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
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
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  text: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '600',
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
    marginRight: 10,
  }
});
