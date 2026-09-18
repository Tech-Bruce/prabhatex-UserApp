import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/src/utils/axiosInstance';
import CategorySkeletonGrid from '@/src/components/CategorySkeletonGrid';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  category: string;
  categoryImage?: string;
  productCount?: number;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/getCategory');
        if (res.data && res.data.success) {
          const fetchedCategories: Category[] = res.data.data;
          
          // Fetch product counts for each category
          const categoriesWithCounts = await Promise.all(
            fetchedCategories.map(async (cat) => {
              try {
                const countRes = await api.get(`/getAllProduct?categoryId=${cat.id}&limit=1`);
                const count = countRes.data?.total || 0;
                return { ...cat, productCount: count };
              } catch (e) {
                return { ...cat, productCount: 0 };
              }
            })
          );
          
          setCategories(categoriesWithCounts);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/150';
    if (url.startsWith('/')) {
      return `https://api.prabhatex.in${url}`;
    }
    return url;
  };

  // Don't separate the first category, show all in the grid
  const gridCategories = categories;

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop by Category</Text>
      </View>

      {/* Extended Maroon Banner */}
      <View style={styles.bannerExtendedContainer}>
        <View style={styles.bannerDecor}>
          <Ionicons name="diamond-outline" size={16} color="#D5A63A" />
          <Text style={styles.bannerTitle}>Curated Categories</Text>
          <Ionicons name="diamond-outline" size={16} color="#D5A63A" />
        </View>
        <Text style={styles.bannerSubtext}>Finest weaves for life's special moments</Text>
      </View>

      {/* Hero Card Overlapping the Banner */}
      <TouchableOpacity 
        style={styles.featuredCard}
        activeOpacity={0.9}
      >
        <Image source={require('../../assets/category-bg.png')} style={styles.featuredImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredGradient}
        >
          <View style={styles.featuredContent}>
            <View>
              <Text style={styles.featuredTitle}>Bridal Collections</Text>
              <Text style={styles.featuredSubtitle}>Explore Designs</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={16} color="#D5A63A" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {gridCategories.length > 0 && (
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Ionicons name="flower-outline" size={20} color="#D5A63A" style={styles.dividerIcon} />
          <View style={styles.dividerLine} />
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <CategorySkeletonGrid itemCount={6} />
      ) : (
        <FlatList
          data={gridCategories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push({ pathname: '/category/[id]', params: { id: item.id } })}
            >
              <Image source={{ uri: getImageUrl(item.categoryImage) }} style={styles.gridImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.gridGradient}
              >
                <View style={styles.gridContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gridTitle} numberOfLines={2}>{item.category}</Text>
                    <Text style={styles.gridSubtitle}>{item.productCount || 0} Designs</Text>
                  </View>
                  <View style={styles.arrowCircleSmall}>
                    <Ionicons name="chevron-forward" size={14} color="#D5A63A" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No categories found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0', // Warm Ivory
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B0000',
  },
  bannerExtendedContainer: {
    backgroundColor: '#850404',
    paddingTop: 16,
    paddingBottom: 60, // Deep padding to allow the card to overlap
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  bannerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#FFF9ED',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  bannerSubtext: {
    color: '#EBD197',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  featuredCard: {
    marginHorizontal: 16,
    marginTop: -40, // Negative margin to overlap the maroon banner
    marginBottom: 16,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#D5A63A',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    justifyContent: 'flex-end',
    padding: 16,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  featuredSubtitle: {
    color: '#D5A63A',
    fontSize: 14,
    fontWeight: '600',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D5A63A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  arrowCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5A63A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D5A63A',
    opacity: 0.5,
  },
  dividerIcon: {
    marginHorizontal: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  gridCard: {
    flex: 1,
    margin: 8,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    justifyContent: 'flex-end',
    padding: 12,
  },
  gridContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  gridTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  gridSubtitle: {
    color: '#D5A63A',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
