import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Animated } from 'react-native';

export default function ProductSkeletonGrid({ itemCount = 6 }: { itemCount?: number }) {
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

  return (
    <View style={styles.gridContainer}>
      {data.map((item) => (
        <View key={item} style={styles.productCard}>
          <Animated.View style={[styles.skeletonImage, { opacity: pulseAnim }]} />
          <View style={styles.productInfo}>
            <Animated.View style={[styles.skeletonTextTitle, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonTextSubtitle, { opacity: pulseAnim }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: { 
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '47%', // roughly half width with space
    marginVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skeletonImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0E0E0',
  },
  productInfo: {
    padding: 12,
  },
  skeletonTextTitle: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '80%',
    marginBottom: 10,
  },
  skeletonTextSubtitle: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '50%',
  },
  
});
