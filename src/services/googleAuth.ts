import { Platform } from 'react-native';

export interface GoogleAuthResult {
  idToken?: string;
  cancelled?: boolean;
  error?: string;
  useFallback?: boolean;
}

let isConfigured = false;

/**
 * Safely retrieve the native GoogleSignin module if available.
 * If running in Expo Go or Web, importing this module throws an Invariant Violation.
 * Using lazy require inside try-catch allows the app to run in Expo Go without crashing.
 */
function getGoogleSigninModule(): any | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-google-signin/google-signin');
    if (mod && mod.GoogleSignin) {
      return mod;
    }
    return null;
  } catch {
    // RNGoogleSignin is not linked (running in Expo Go)
    return null;
  }
}

export function configureGoogleSignIn(): boolean {
  if (isConfigured) return true;
  if (Platform.OS === 'web') return false;

  const mod = getGoogleSigninModule();
  if (!mod?.GoogleSignin) {
    return false;
  }

  try {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!webClientId) {
      console.warn('EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set in environment.');
      return false;
    }

    mod.GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
    isConfigured = true;
    return true;
  } catch (error) {
    console.warn('Failed to configure GoogleSignin:', error);
    return false;
  }
}

export async function promptGoogleSignIn(): Promise<GoogleAuthResult> {
  if (Platform.OS === 'web') {
    return { useFallback: true };
  }

  const mod = getGoogleSigninModule();
  if (!mod?.GoogleSignin) {
    // Native module not linked (e.g. running in Expo Go) -> fallback to browser/auth session
    return { useFallback: true };
  }

  try {
    const configured = configureGoogleSignIn();
    if (!configured) {
      return { useFallback: true };
    }

    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isSuccessResponse && isSuccessResponse(response)) {
      const idToken = response.data?.idToken;
      if (!idToken) {
        return { error: 'No ID token received from Google.' };
      }
      return { idToken };
    } else if (response?.data?.idToken) {
      return { idToken: response.data.idToken };
    }

    // Response was cancelled or dismissed
    return { cancelled: true };
  } catch (error: any) {
    const mod = getGoogleSigninModule();
    if (mod?.isErrorWithCode && mod.isErrorWithCode(error)) {
      const statusCodes = mod.statusCodes;
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { cancelled: true };
        case statusCodes.IN_PROGRESS:
          return { error: 'Google sign-in is already in progress.' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { error: 'Google Play Services is not available or outdated on this device.' };
        default:
          return { error: error.message || 'Google sign-in failed.' };
      }
    }

    const message = String(error?.message || error || '');
    if (
      message.includes('RNGoogleSignin') ||
      message.includes('not linked') ||
      message.includes('null is not an object') ||
      message.includes('NativeModule')
    ) {
      return { useFallback: true };
    }

    return { error: message || 'Google sign-in failed.' };
  }
}
