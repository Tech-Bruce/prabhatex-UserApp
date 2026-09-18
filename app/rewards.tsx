import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function RewardsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'My Rewards', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tier Card */}
        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <MaterialCommunityIcons name="crown" size={32} color="#F9D976" />
            <Text style={styles.tierTitle}>Silver Member</Text>
            <Text style={styles.tierSubtitle}>Prabha Privilege</Text>
          </View>
          
          <View style={styles.pointsCircle}>
            <Text style={styles.pointsValue}>320</Text>
            <Text style={styles.pointsLabel}>Available Points</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>180 points away from Gold</Text>
              <Text style={styles.targetText}>500</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '64%' }]} />
            </View>
          </View>
        </View>

        {/* Available Coupons */}
        <Text style={styles.sectionTitle}>Redeem Points</Text>
        <View style={styles.couponCard}>
          <View style={styles.couponLeft}>
            <Text style={styles.discount}>10% OFF</Text>
            <Text style={styles.couponDesc}>On minimum purchase of ₹5,000</Text>
          </View>
          <View style={styles.couponRight}>
            <TouchableOpacity style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem</Text>
              <Text style={styles.redeemPoints}>150 pts</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.couponCard}>
          <View style={styles.couponLeft}>
            <Text style={styles.discount}>FREE SHIPPING</Text>
            <Text style={styles.couponDesc}>Valid on all prepaid orders</Text>
          </View>
          <View style={styles.couponRight}>
            <TouchableOpacity style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem</Text>
              <Text style={styles.redeemPoints}>50 pts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Recent History</Text>
        <View style={styles.historyCard}>
          <View style={styles.historyItem}>
            <View style={styles.historyIconEarn}>
              <Ionicons name="add" size={16} color="#2E7D32" />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Order #PTT0120</Text>
              <Text style={styles.historyDate}>1 Sep 2026</Text>
            </View>
            <Text style={styles.historyPointsEarned}>+68 pts</Text>
          </View>
          <View style={[styles.historyItem, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
            <View style={styles.historyIconSpend}>
              <Ionicons name="remove" size={16} color="#C62828" />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Redeemed 10% Coupon</Text>
              <Text style={styles.historyDate}>15 Aug 2026</Text>
            </View>
            <Text style={styles.historyPointsSpent}>-150 pts</Text>
          </View>
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
  tierCard: {
    backgroundColor: '#6A0C0B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  tierHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tierTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  tierSubtitle: {
    fontSize: 12,
    color: '#F9D976',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  pointsCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(249, 217, 118, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pointsValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#F9D976',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
  },
  targetText: {
    fontSize: 12,
    color: '#F9D976',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#F9D976',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  couponCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    borderStyle: 'dashed',
  },
  couponLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#F0EBE1',
    paddingRight: 12,
  },
  discount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#850404',
    marginBottom: 4,
  },
  couponDesc: {
    fontSize: 12,
    color: '#666',
  },
  couponRight: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  redeemBtn: {
    backgroundColor: '#850404',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  redeemBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  redeemPoints: {
    color: '#F9D976',
    fontSize: 10,
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyIconEarn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyIconSpend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
    color: '#888',
  },
  historyPointsEarned: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  historyPointsSpent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C62828',
  },
});
