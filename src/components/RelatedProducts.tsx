import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import api from '@/src/utils/axiosInstance';
import ProductCard from '@/src/components/ProductCard';
import ProductSkeletonGrid from '@/src/components/ProductSkeletonGrid';
import { spacing } from '@/src/theme/colors';

const { width } = Dimensions.get('window');

interface RelatedProductsProps {
  categoryId?: string | number;
  currentProductId: string;
}

export default function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    const fetchRelatedProducts = async () => {
      try {
        const res = await api.get('/getAllProduct', {
          params: { categoryId, limit: 12 },
        });
        
        if (res.data && res.data.success && res.data.data) {
          // Filter out the current product
          const related = res.data.data.filter((p: any) => p.id !== currentProductId).slice(0, 10);
          setProducts(related);
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryId, currentProductId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Related Products</Text>
        <ProductSkeletonGrid itemCount={2} />
      </View>
    );
  }

  if (products.length === 0) {
    return null; // Don't show anything if no related products
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Related Products</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard product={item} width={width * 0.42} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
  },
  cardWrapper: {
    marginHorizontal: 6,
  },
});
