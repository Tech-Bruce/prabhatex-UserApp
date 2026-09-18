import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/src/utils/axiosInstance';
import SearchBarHeader from '@/src/components/SearchBarHeader';
import ProductSkeletonGrid from '@/src/components/ProductSkeletonGrid';
import FilterModal, { FilterOptions } from '@/src/components/FilterModal';
import ProductCard from '@/src/components/ProductCard';

interface Product {
  id: string;
  productName: string;
  price: string;
  finalPrice: string;
  productImages: string[];
  category?: { category: string };
}

export default function SearchScreen() {
  const router = useRouter();
  
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Use a ref to store the timeout so we can clear it
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSearchResults = async (
    text: string, 
    currentSortBy = sortBy, 
    currentSortOrder = sortOrder, 
    currentMinPrice = minPrice, 
    currentMaxPrice = maxPrice
  ) => {
    if (!text.trim()) {
      setProducts([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let endpoint = `/getAllProduct?search=${encodeURIComponent(text.trim())}`;
      if (currentSortBy) endpoint += `&sortBy=${currentSortBy}`;
      if (currentSortOrder) endpoint += `&sortOrder=${currentSortOrder}`;
      if (currentMinPrice) endpoint += `&minPrice=${currentMinPrice}`;
      if (currentMaxPrice) endpoint += `&maxPrice=${currentMaxPrice}`;

      const res = await api.get(endpoint);
      if (res.data && res.data.success !== false) {
        const results = res.data.data || res.data.hits || res.data || [];
        setProducts(Array.isArray(results) ? results : []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to search products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);
    
    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set a new timeout to trigger search after 500ms
    typingTimeout.current = setTimeout(() => {
      fetchSearchResults(text, sortBy, sortOrder, minPrice, maxPrice);
    }, 500);
  };

  const applyFilters = (filters: FilterOptions) => {
    setFilterVisible(false);
    setSortBy(filters.sortBy);
    setSortOrder(filters.sortOrder);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    fetchSearchResults(query, filters.sortBy, filters.sortOrder, filters.minPrice, filters.maxPrice);
  };
  
  const resetFilters = () => {
    setSortBy('');
    setSortOrder('');
    setMinPrice('');
    setMaxPrice('');
    setFilterVisible(false);
    fetchSearchResults(query, '', '', '', '');
  };

  const getImageUrl = (images?: string[]) => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/150';
    let url = images[0];
    if (url.startsWith('/')) {
      return `http://10.93.111.50:8080${url}`;
    }
    return url;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBarHeader 
        placeholder="Search by name or SKU..."
        searchValue={query}
        onSearchChange={handleSearchChange}
        autoFocus={true}
        onSearchFocus={() => {}} // empty function prevents infinite push to /search
        onSubmitEditing={() => fetchSearchResults(query)}
        onBackPress={() => router.back()}
        showFilter={true}
        onFilterPress={() => {
          import('react-native').then(({ Keyboard }) => Keyboard.dismiss());
          setFilterVisible(true);
        }}
      />
      {loading ? (
        <ProductSkeletonGrid itemCount={6} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => item.id || index.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ProductCard product={item as any} />
          )}
          ListEmptyComponent={
            hasSearched && query.trim() !== '' ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>No products found for "{query}".</Text>
              </View>
            ) : (
              <View style={styles.center}>
                <Text style={styles.placeholderText}>Start typing to search products...</Text>
              </View>
            )
          }
        />
      )}

      <FilterModal
        visible={filterVisible}
        initialFilters={{ sortBy, sortOrder, minPrice, maxPrice }}
        onApply={applyFilters}
        onReset={resetFilters}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  listContent: { padding: 8, paddingBottom: 40 },
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
  emptyText: { color: '#888', fontSize: 16, textAlign: 'center' },
  placeholderText: { color: '#AAA', fontSize: 16, textAlign: 'center' }
});
