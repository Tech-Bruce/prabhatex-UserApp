import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/axiosInstance';
import SearchBarHeader from '@/src/components/SearchBarHeader';
import ProductSkeletonGrid from '@/src/components/ProductSkeletonGrid';
import FilterModal, { FilterOptions } from '@/src/components/FilterModal';
import ProductCard from '@/src/components/ProductCard';
import { useCart } from '@/src/context/CartContext';

interface Product {
  id: string;
  productName: string;
  price: string;
  finalPrice: string;
  productImages: string[];
  category?: { category: string };
}

export default function AllProductsScreen() {
  const router = useRouter();
  const { totalItems } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProducts = async (
    pageNum: number,
    currentSortBy = sortBy,
    currentSortOrder = sortOrder,
    currentMinPrice = minPrice,
    currentMaxPrice = maxPrice
  ) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      let endpoint = `/getAllProduct?page=${pageNum}&limit=50`;
      if (currentSortBy) endpoint += `&sortBy=${currentSortBy}`;
      if (currentSortOrder) endpoint += `&sortOrder=${currentSortOrder}`;
      if (currentMinPrice) endpoint += `&minPrice=${currentMinPrice}`;
      if (currentMaxPrice) endpoint += `&maxPrice=${currentMaxPrice}`;

      const res = await api.get(endpoint);
      if (res.data && res.data.success) {
        if (pageNum === 1) {
          setProducts(res.data.data);
          // Store the total count from the API (all pages)
          if (res.data.total !== undefined) setTotalCount(res.data.total);
          else if (res.data.totalCount !== undefined) setTotalCount(res.data.totalCount);
        } else {
          setProducts((prev) => [...prev, ...res.data.data]);
        }
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, sortBy, sortOrder, minPrice, maxPrice);
    }
  };

  const applyFilters = (filters: FilterOptions) => {
    setFilterVisible(false);
    setSortBy(filters.sortBy);
    setSortOrder(filters.sortOrder);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setPage(1);
    fetchProducts(1, filters.sortBy, filters.sortOrder, filters.minPrice, filters.maxPrice);
  };
  
  const resetFilters = () => {
    setSortBy('');
    setSortOrder('');
    setMinPrice('');
    setMaxPrice('');
    setFilterVisible(false);
    setPage(1);
    fetchProducts(1, '', '', '', '');
  };

  const getImageUrl = (images?: string[]) => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/150';
    let url = images[0];
    if (url.startsWith('/')) {
      return `https://api.prabhatex.in${url}`;
    }
    return url;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#850404" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>All Products</Text>
          {totalCount !== null && (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{totalCount.toLocaleString('en-IN')} items</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="bag-outline" size={22} color="#850404" />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <SearchBarHeader 
        showFilter={true} 
        placeholder="Search all products..."
        hideBack={true}
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
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          }
          ListFooterComponent={
            page < totalPages ? (
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.loadMoreButton} 
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE1',
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#850404',
  },
  countChip: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F5C6C6',
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#850404',
  },
  cartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5C6C6',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#850404',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  listContent: { padding: 8 },
  emptyText: { color: '#888', fontSize: 16 },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#850404',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
