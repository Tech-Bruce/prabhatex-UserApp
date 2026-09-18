import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, FlatList, TouchableOpacity, Linking, ActivityIndicator, Platform } from 'react-native';
import api from '@/src/utils/axiosInstance';
import BannerSkeleton from '@/src/components/BannerSkeleton';

const { width } = Dimensions.get('window');

interface Banner {
  _id?: string;
  id?: string;
  image: string;
  link?: string;
  orderIndex: number;
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Create an artificially massive array to simulate infinite scroll
  // This is a highly performant trick because FlatList virtualizes the items anyway
  const infiniteBanners = banners.length > 0 ? Array(200).fill(banners).flat() : [];

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await api.get('/getBanners');
        if (response.data && response.data.success) {
          const sortedBanners = response.data.data.sort((a: Banner, b: Banner) => (a.orderIndex || 0) - (b.orderIndex || 0));
          setBanners(sortedBanners);
          
          // Start exactly in the middle of our massive array so the user can swipe infinitely left AND right
          if (sortedBanners.length > 0) {
            const middleIndex = sortedBanners.length * 100;
            setActiveIndex(middleIndex);
          }
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex && roundIndex >= 0 && roundIndex < infiniteBanners.length) {
      setActiveIndex(roundIndex);
    }
  };

  const handlePress = (link?: string) => {
    if (link) {
      Linking.canOpenURL(link).then(supported => {
        if (supported) Linking.openURL(link);
      });
    }
  };

  if (loading) {
    return <BannerSkeleton />;
  }

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={infiniteBanners}
        keyExtractor={(item, index) => `${item._id || item.id}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        initialScrollIndex={banners.length * 100}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => {
          let imageUrl = item.image;
          if (imageUrl && imageUrl.startsWith('/')) {
             imageUrl = `https://api.prabhatex.in${imageUrl}`;
          }

          return (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => handlePress(item.link)}
              style={styles.slideContainer}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        }}
      />
      <View style={styles.pagination}>
        {banners.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              // Calculate the true active index for the dots
              (activeIndex % banners.length) === i ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220, 
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width - 16, // 16px margin on each side
    height: 210,
    borderRadius: 10, // Rounded corners on all sides
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FBBF24',
    width: 18, 
  },
  inactiveDot: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
