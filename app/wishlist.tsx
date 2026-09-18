import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '@/src/context/WishlistContext';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlist, removeFromWishlist } = useWishlist();

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/400';
    if (url.startsWith('/')) {
      const baseHost = 'http://10.93.111.50:8080';
      return `${baseHost}${url}`;
    }
    return url;
  };

  if (wishlist.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
        <Stack.Screen options={{ title: 'Wishlist', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>Save your favorite items here!</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
      <Stack.Screen options={{ title: `Wishlist (${wishlist.length})`, headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {wishlist.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
            >
              <Image source={{ uri: getImageUrl(item.image) }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeBtn}
                onPress={() => removeFromWishlist(item.id)}
              >
                <Ionicons name="trash" size={16} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.details}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.finalPrice}>₹{item.finalPrice}</Text>
                  {item.price > item.finalPrice && (
                    <Text style={styles.price}>₹{item.price}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  shopBtn: {
    marginTop: 24,
    backgroundColor: '#850404',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 48) / 2, // 2 columns with 16px padding on sides and 16px gap
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#850404',
    marginRight: 6,
  },
  price: {
    fontSize: 11,
    color: '#888',
    textDecorationLine: 'line-through',
  },
});
