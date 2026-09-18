import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { useFonts } from 'expo-font';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '@/src/theme/colors';
import { AuthProvider } from '@/src/context/AuthContext';
import { CartProvider } from '@/src/context/CartContext';
import { WishlistProvider } from '@/src/context/WishlistContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Add custom fonts here later if needed
  });

  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  const animation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function prepareApp() {
      try {
        // Pre-load fonts, make any API calls you need to do here
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsAppReady(true);
      }
    }
    
    prepareApp();
  }, []);

  useEffect(() => {
    if (isAppReady && (fontsLoaded || fontError)) {
      const hideSplash = async () => {
        // Hide the native splash screen and immediately show our animated one
        await SplashScreen.hideAsync();
        
        Animated.sequence([
          // Hold the splash screen for 1.5 seconds so the user can see it
          Animated.delay(1500),
          // Then fade it out over 1 second
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          })
        ]).start(() => setAnimationComplete(true));
      };
      
      hideSplash();
    }
  }, [isAppReady, fontsLoaded, fontError, animation]);

  if (!isAppReady || (!fontsLoaded && !fontError)) {
    // Return null to keep the native splash screen visible while loading
    return null;
  }

  return (
    <SafeAreaProvider>
    <AuthProvider>
    <WishlistProvider>
    <CartProvider>
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false, // Hide headers by default for scalable custom headers
          contentStyle: { backgroundColor: colors.background },
        }}
      />

      {!isSplashAnimationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#6B0000',
              opacity: animation,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          <Animated.Image
            style={{
              width: 200,
              height: 200,
              resizeMode: 'contain',
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.5, 1],
                  })
                }
              ]
            }}
            source={require('../assets/logo_new.png')}
          />
        </Animated.View>
      )}
      <Toast />
    </View>
    </CartProvider>
    </WishlistProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
