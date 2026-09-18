import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'About Prabha Tex', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerImageContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1583391733958-d25e019f9e31?auto=format&fit=crop&w=800&q=80' }} 
            style={styles.headerImage} 
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Tradition Wears</Text>
            <Text style={styles.overlaySubtitle}>A Brighter Tomorrow</Text>
          </View>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.paragraph}>
            Prabha Tex was founded with a vision to bring the finest Indian ethnic wear to the world. We specialize in authentic silk sarees, hand-woven with love and precision by master artisans.
          </Text>
          
          <Text style={styles.paragraph}>
            For over two decades, we have been the trusted destination for bridal trousseaus, festival wear, and exquisite fabrics that celebrate the rich heritage of India.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>20+</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>50k+</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Authentic</Text>
            </View>
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Prabha Tex App v1.0.0</Text>
          <Text style={styles.copyright}>© 2026 Prabha Tex. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  scrollContent: {
    padding: 16,
  },
  headerImageContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, top: 0,
    backgroundColor: 'rgba(106, 12, 11, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  overlaySubtitle: {
    fontSize: 16,
    color: '#F9D976',
    marginTop: 4,
    fontStyle: 'italic',
  },
  contentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  paragraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE1',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#850404',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#AAA',
  },
});
