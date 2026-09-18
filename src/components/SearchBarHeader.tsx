import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '@/src/context/CartContext';

interface SearchBarHeaderProps {
  // Search properties
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSearchFocus?: () => void;
  onSubmitEditing?: () => void;
  
  // Icon visibility toggles
  showFilter?: boolean;
  onFilterPress?: () => void;
  
  showCart?: boolean;
  cartCount?: number;
  onCartPress?: () => void;
  
  showShare?: boolean;
  onSharePress?: () => void;
  
  // Back navigation
  onBackPress?: () => void;
  hideBack?: boolean;
}

export default function SearchBarHeader({
  searchValue = '',
  onSearchChange,
  placeholder = 'Search...',
  autoFocus = false,
  onSearchFocus,
  onSubmitEditing,
  showFilter = false,
  onFilterPress,
  showCart = false,
  cartCount: propCartCount = 0,
  onCartPress: propOnCartPress,
  showShare = false,
  onSharePress,
  onBackPress,
  hideBack = false,
}: SearchBarHeaderProps) {
  const router = useRouter();
  const { totalItems } = useCart();
  
  const cartCount = propCartCount || totalItems;
  const onCartPress = propOnCartPress || (() => router.push('/cart'));
  
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Back Button */}
      {!hideBack && (
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color="#850404" />
        </TouchableOpacity>
      )}

      {/* Search Input Area */}
      <TouchableOpacity 
        style={styles.searchContainer}
        activeOpacity={onSearchFocus ? 1 : 0.7}
        onPress={() => {
          if (!onSearchFocus) {
            router.push('/search');
          }
        }}
      >
        <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
        <View style={styles.searchInputWrapper} pointerEvents={onSearchFocus ? 'auto' : 'none'}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={searchValue}
            onChangeText={onSearchChange}
            autoFocus={autoFocus}
            onFocus={onSearchFocus}
            onSubmitEditing={onSubmitEditing}
            returnKeyType="search"
            editable={!!onSearchFocus}
          />
        </View>
      </TouchableOpacity>

      {/* Right Icons Container */}
      <View style={styles.rightIconsContainer}>
        {showShare && (
          <TouchableOpacity onPress={onSharePress} style={styles.rightIconButton}>
            <Ionicons name="share-social-outline" size={22} color="#850404" />
          </TouchableOpacity>
        )}

        {showFilter && (
          <TouchableOpacity onPress={onFilterPress} style={styles.rightIconButton}>
            <Ionicons name="filter" size={22} color="#850404" />
          </TouchableOpacity>
        )}

        {showCart && (
          <TouchableOpacity onPress={onCartPress} style={styles.rightIconButton}>
            <Ionicons name="bag-handle-outline" size={22} color="#850404" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconButton: {
    padding: 4,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInputWrapper: {
    flex: 1,
    height: '100%',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#333',
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  rightIconButton: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: '#850404',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
