import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function CategorySkeletonGrid({ itemCount = 6 }: { itemCount?: number }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const data = Array.from({ length: itemCount }, (_, i) => i.toString());

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Animated.View style={[styles.skeletonTitle, { opacity: pulseAnim }]} />
      </View>

      <View style={styles.bannerExtendedContainer}>
        <Animated.View style={[styles.skeletonBannerTitle, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonBannerSub, { opacity: pulseAnim }]} />
      </View>

      <Animated.View style={[styles.featuredCard, { opacity: pulseAnim }]} />
      
      <View style={styles.dividerContainer}>
        <Animated.View style={[styles.dividerLine, { opacity: pulseAnim }]} />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={() => (
          <Animated.View style={[styles.gridCard, { opacity: pulseAnim }]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonTitle: {
    height: 28,
    width: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
  bannerExtendedContainer: {
    backgroundColor: '#850404',
    paddingTop: 16,
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  skeletonBannerTitle: {
    height: 24,
    width: 180,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonBannerSub: {
    height: 14,
    width: 220,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  featuredCard: {
    marginHorizontal: 16,
    marginTop: -40,
    marginBottom: 16,
    height: 220,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  dividerContainer: {
    paddingHorizontal: 40,
    marginBottom: 16,
    alignItems: 'center',
  },
  dividerLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#D5A63A',
    opacity: 0.3,
  },
  listContent: {
    paddingBottom: 24,
  },
  gridCard: {
    flex: 1,
    margin: 8,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
});
