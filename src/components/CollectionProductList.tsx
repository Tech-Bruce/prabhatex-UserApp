import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/src/utils/axiosInstance';
import ProductSkeletonGrid from '@/src/components/ProductSkeletonGrid';
import ProductCard from '@/src/components/ProductCard';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  productName: string;
  price: string;
  finalPrice: string;
  productImages: string[];
  category?: { category: string };
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  products: Product[];
}

export default function CollectionProductList() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await api.get('/collections');
        if (res.data) {
          // Assuming the data is an array of collections
          const availableCollections = (Array.isArray(res.data) ? res.data : [])
            .filter((c: any) => c.products && c.products.length > 0);
          setCollections(availableCollections);
        }
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const getImageUrl = (images?: string[]) => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/150';
    let url = images[0];
    if (url.startsWith('/')) {
      return `http://10.93.111.50:8080${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ProductSkeletonGrid itemCount={4} />
      </View>
    );
  }

  if (collections.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No collections found. Please check your API connection.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {collections.map((collection, index) => {
        const isEven = index % 2 === 0;
        
        return (
          <View key={collection.id || index} style={styles.collectionSection}>
            {/* Header */}
            <View style={[styles.headerContainer, isEven ? styles.headerLeft : styles.headerRight]}>
              <View style={styles.eyebrowRow}>
                {!isEven && <View style={styles.goldLine} />}
                <Text style={styles.eyebrow}>Exclusive Set</Text>
                {isEven && <View style={styles.goldLine} />}
              </View>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <View style={[styles.underline, isEven ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }]} />
              {collection.description && (
                <Text style={[styles.description, isEven ? { textAlign: 'left' } : { textAlign: 'right' }]}>
                  {collection.description}
                </Text>
              )}
            </View>

            {/* Horizontal Product List */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              data={collection.products.slice(0, 8)} // Show up to 8 items in the horizontal scroll
              keyExtractor={(item) => item.id}
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={3}
              removeClippedSubviews={true}
              renderItem={({ item }) => (
                <ProductCard product={item} width={width * 0.42} />
              )}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: '#f5c021' }]} />
                <View style={[styles.dot, styles.dotLarge, { backgroundColor: '#850404' }]} />
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: '#f5c021' }]} />
              </View>
              <View style={styles.dividerLine} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#fff9f0',
  },
  center: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionSection: {
    marginBottom: 24,
  },
  headerContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  goldLine: {
    height: 1,
    width: 30,
    backgroundColor: '#f5c021',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#c9930a',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  collectionName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#850404',
    marginBottom: 8,
  },
  underline: {
    height: 3,
    width: 60,
    backgroundColor: '#f5c021',
    borderRadius: 2,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#9a7a6a',
    maxWidth: '80%',
    lineHeight: 18,
  },
  productList: {
    paddingHorizontal: 12,
  },
  productCard: {
    width: width * 0.42,
    marginHorizontal: 6,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#850404',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    opacity: 0.6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#850404',
    opacity: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  dot: {
    borderRadius: 10,
  },
  dotSmall: {
    width: 4,
    height: 4,
  },
  dotLarge: {
    width: 6,
    height: 6,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});
