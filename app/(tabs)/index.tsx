import { Image, StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/theme/colors';
import Header from '@/src/components/Header';
import BannerSlider from '@/src/components/BannerSlider';
import CategoryList from '@/src/components/CategoryList';
import CollectionProductList from '@/src/components/CollectionProductList';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Incrementing the key forces all child components to remount and re-fetch their API data
    setRefreshKey((prevKey) => prevKey + 1);
    
    // Stop the spinner after a brief delay to let network requests start
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  
  return (
    <View style={styles.container}>
      <Header cartCount={3} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#850404']} />
        }
      >
        <BannerSlider key={`banner-${refreshKey}`} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
        </View>
        <CategoryList key={`category-${refreshKey}`} horizontal={true} />
        <CollectionProductList key={`collection-${refreshKey}`} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F0' },
  content: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  logo: { width: 110, height: 110 },
  eyebrow: { marginTop: spacing.sm, color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2.2 },
  title: { marginTop: spacing.xl, color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { marginTop: spacing.sm, maxWidth: 420, color: colors.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, backgroundColor: '#FAF6F0' },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: '#6B0000' },
});
