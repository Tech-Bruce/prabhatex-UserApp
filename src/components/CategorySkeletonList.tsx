import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Animated } from 'react-native';

export default function CategorySkeletonList({ itemCount = 5 }: { itemCount?: number }) {
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
    <FlatList
      data={data}
      keyExtractor={(item) => item}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={() => (
        <View style={styles.categoryContainer}>
          <Animated.View style={[styles.skeletonCircle, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonText, { opacity: pulseAnim }]} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  categoryContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  skeletonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  skeletonText: {
    height: 12,
    width: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});
