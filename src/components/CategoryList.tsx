import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/src/utils/axiosInstance';
import CategorySkeletonList from '@/src/components/CategorySkeletonList';

interface Category {
  id: string;
  category: string;
  categoryImage?: string;
}

interface CategoryListProps {
  horizontal?: boolean;
}

export default function CategoryList({ horizontal = false }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/getCategory');
        if (res.data && res.data.success) {
          setCategories(res.data.data);
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
      const baseHost = 'http://10.93.111.50:8080';
      return `${baseHost}${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#850404" />
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal={horizontal}
        numColumns={horizontal ? undefined : 3}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.listContentHorizontal : styles.listContentVertical}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.categoryCard, horizontal && styles.categoryCardHorizontal]}
            onPress={() => router.push({ pathname: '/category/[id]', params: { id: item.id } })}
          >
            <View style={[styles.imageContainer, horizontal && styles.imageContainerHorizontal]}>
              <Image 
                source={{ uri: getImageUrl(item.categoryImage) }} 
                style={styles.image} 
              />
            </View>
            <Text style={styles.categoryText} numberOfLines={2} ellipsizeMode="tail">
              {item.category}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF6F0',
    paddingVertical: 10,
  },
  center: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentHorizontal: {
    paddingHorizontal: 12,
  },
  listContentVertical: {
    padding: 12,
  },
  categoryCard: {
    flex: 1,
    alignItems: 'center',
    margin: 8,
    maxWidth: '30%',
  },
  categoryCardHorizontal: {
    maxWidth: 90,
    marginHorizontal: 12,
    marginVertical: 0,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D5A63A', // Gold border
    elevation: 3,
    shadowColor: '#6B0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  imageContainerHorizontal: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1111',
    textAlign: 'center',
  },
});
