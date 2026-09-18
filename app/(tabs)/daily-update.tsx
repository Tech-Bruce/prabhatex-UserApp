import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function DailyUpdateScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/getAllProduct?dailyUpdate=true&page=${pageNum}&limit=10`);
      if (res.data && res.data.success) {
        if (pageNum === 1) {
          setProducts(res.data.data);
        } else {
          setProducts((prev) => [...prev, ...res.data.data]);
        }
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch daily updates:', err);
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
      fetchProducts(nextPage);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBarHeader
        showFilter={true}
        placeholder="Search daily updates..."
      />

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Daily Updates</Text>
        <Text style={styles.headerSubtitle}>Fresh styles added today</Text>
      </View>

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
            <ProductCard product={item} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No new daily updates today.</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  headerTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#850404',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
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
