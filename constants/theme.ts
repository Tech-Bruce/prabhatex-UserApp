import { colors } from '@/src/theme/colors';

export const Colors = {
  light: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    icon: colors.textMuted,
    tabIconDefault: colors.textLight,
    tabIconSelected: colors.primary,
  },
  dark: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    icon: colors.textMuted,
    tabIconDefault: colors.textLight,
    tabIconSelected: colors.primary,
  },
} as const;
