import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import ProductCard from '@/src/components/ProductCard';
import { useRecentlyViewed } from '@/src/hooks/useRecentlyViewed';
import { spacing } from '@/src/theme/colors';

const { width } = Dimensions.get('window');

interface RecentlyViewedProductsProps {
  currentProductId?: string;
}

export default function RecentlyViewedProducts({ currentProductId }: RecentlyViewedProductsProps) {
  const { recentlyViewed } = useRecentlyViewed();

  // Filter out the current product from the recently viewed list so we don't show it while viewing it
  const displayProducts = recentlyViewed.filter(p => p.id !== currentProductId);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recently Viewed</Text>
      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard product={item as any} width={width * 0.42} />
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
