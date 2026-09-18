import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/axiosInstance';
import SearchBarHeader from '@/src/components/SearchBarHeader';
import ProductSkeletonGrid from '@/src/components/ProductSkeletonGrid';
import ProductCard from '@/src/components/ProductCard';

interface Product {
  id: string;
  productName: string;
  price: string;
  finalPrice: string;
  productImages: string[];
  category?: { category: string };
}

export default function CategoryProductsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/getAllProduct?categoryId=${id}`);
        if (res.data && res.data.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch products for category:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProducts();
  }, [id]);

  const getImageUrl = (images?: string[]) => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/150';
    let url = images[0];
    if (url.startsWith('/')) {
      const baseHost = 'http://10.93.111.50:8080';
      return `${baseHost}${url}`;
    }
    return url;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBarHeader 
        showFilter={true} 
        placeholder="Search products..."
      />

      {loading ? (
        <ProductSkeletonGrid itemCount={6} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={({ item }) => (
            <ProductCard product={item as any} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No products found in this category.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  listContent: { padding: 8 },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: { width: '100%', height: 180, resizeMode: 'cover' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  finalPrice: { fontSize: 16, fontWeight: 'bold', color: '#850404', marginRight: 8 },
  originalPrice: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  emptyText: { color: '#888', fontSize: 16 },
});
