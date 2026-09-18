import React, { forwardRef, useId, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/src/theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input({ label, error, style, containerStyle, secureTextEntry, leftIcon, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const errorId = useId();
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer, 
        focused && styles.inputFocused,
        error ? styles.inputError : null,
      ]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.textLight}
          secureTextEntry={secureTextEntry && !revealed}
          accessibilityLabel={rest.accessibilityLabel || label}
          accessibilityHint={error || rest.accessibilityHint}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable accessibilityRole="button" accessibilityLabel={revealed ? 'Hide password' : 'Show password'} hitSlop={12} onPress={() => setRevealed((value) => !value)} style={styles.eyeButton}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      
      {error && <Text nativeID={errorId} accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    color: '#4B5563', // colors.textMuted
    marginBottom: 8,
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0.3,
    fontStyle: 'normal',
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  inputFocused: { 
    borderColor: colors.secondary, // Gold focus state
    borderWidth: 1.5, 
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    fontStyle: 'normal',
  },
  eyeButton: { minWidth: 42, height: 50, alignItems: 'flex-end', justifyContent: 'center' },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  }
});
