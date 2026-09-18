export const colors = {
  primary: '#7A1010',
  primaryPressed: '#5E0909',
  primarySoft: '#F8EEEE',
  secondary: '#D4AF37', // Luxurious Gold
  background: '#F9F8F6', // Softer, warmer cream
  surface: '#FFFFFF',
  surfaceMuted: '#F3F1ED',
  border: '#E8E4DD',
  text: '#1C1917',
  textMuted: '#78716C',
  textLight: '#A8A29E',
  white: '#FFFFFF',
  black: '#000000',
  
  success: '#18794E',
  successSoft: '#EAF7F0',
  warning: '#A15C00',
  error: '#B42318',
  errorSoft: '#FEF0EF',
  info: '#176B87',
  
  gradientPrimary: ['#8A1313', '#620A0A'] as const,
  gradientGold: ['#E6C27A', '#C59B27'] as const,
  glassBg: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 } as const;
export const radii = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;
