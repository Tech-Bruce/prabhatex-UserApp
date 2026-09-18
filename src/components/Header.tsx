import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '@/src/context/CartContext';

interface HeaderProps {
  cartCount?: number;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
}

const MESSAGES = [
  "✨ New Festive Arrivals : Explore Our Collections",
  "🚚 Free shipping above ₹2,999",
  "Traditional Craftsmanship Meets Modern Elegance",
  "🎁 Use code WELCOME10 for 10% Discount",
];

const Header: React.FC<HeaderProps> = ({
  cartCount = 3,
  onSearchPress,
  onFilterPress,
  onNotificationPress,
  onCartPress,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { totalItems } = useCart();

  // insets.top accurately reflects safe area on both iOS and Android. 
  // Android solid status bar will return 0, preventing the double-padding bug.
  const topPadding = insets.top;

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
  const prevSlide = () => setMessageIndex((prev) => (prev - 1 + MESSAGES.length) % MESSAGES.length);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBBF24" />

      {/* Top Banner (Scrolling) */}
      <View style={[styles.banner, { paddingTop: topPadding }]}>
        <View style={styles.bannerContent}>
          <TouchableOpacity onPress={prevSlide} style={styles.arrowButton}>
            <Text style={styles.arrowText}>❮</Text>
          </TouchableOpacity>
          <Text style={styles.bannerText} numberOfLines={1} ellipsizeMode="tail">
            {MESSAGES[messageIndex]}
          </Text>
          <TouchableOpacity onPress={nextSlide} style={styles.arrowButton}>
            <Text style={styles.arrowText}>❯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Header Row */}
      <View style={styles.mainHeader}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoTitle}>Prabha Tex</Text>
            <View style={styles.logoSubtitleWrapper}>
              <Text style={styles.logoSubtitle}>நெசவாளரின் நேரடி விற்பனை</Text>
            </View>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCartPress || (() => router.push('/cart'))} style={styles.iconButton}>
            <Ionicons name="bag-handle-outline" size={26} color="#FFFFFF" />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {totalItems > 9 ? '9+' : totalItems}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar Row */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchBox} onPress={onSearchPress || (() => router.push('/search'))}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <Text style={styles.searchText}>Search sarees or SKU</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#850404',
    borderBottomWidth: 1,
    borderBottomColor: '#6B0000',
  },
  banner: {
    backgroundColor: '#FBBF24',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  arrowButton: {
    paddingHorizontal: 8,
  },
  arrowText: {
    color: '#850404',
    fontSize: 16,
    fontWeight: '900',
  },
  bannerText: {
    color: '#850404',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 40,
    width: 40,
    marginRight: 8,
  },
  logoTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  logoSubtitleWrapper: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  logoSubtitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#850404',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 22,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#850404',
  },
  badgeText: {
    color: '#850404',
    fontSize: 10,
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    color: '#888',
    fontSize: 15,
  },
});

export default Header;
