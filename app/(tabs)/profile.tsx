import React, { useState, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useWishlist } from '@/src/context/WishlistContext';
import api from '@/src/utils/axiosInstance';
import { colors, spacing, radii } from '@/src/theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { wishlist } = useWishlist();
  const router = useRouter();

  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({
    processing: 0,
    shipped: 0,
    delivered: 0,
    returns: 0
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfileData = async () => {
        if (!user) return;
        try {
          const [ordersRes, addressRes] = await Promise.all([
            api.get('/my-orders'),
            api.get('/address')
          ]);

          if (isActive) {
            const orders = ordersRes.data.orders || [];
            const addresses = addressRes.data.data || [];
            
            setAddressCount(addresses.length);

            let processing = 0, shipped = 0, delivered = 0, returns = 0;
            let latestActiveOrder: any = null;

            orders.forEach((o: any) => {
              const s = o.status?.toLowerCase() || '';
              if (s === 'processing' || s === 'pending') processing++;
              else if (s === 'shipped') shipped++;
              else if (s === 'delivered') delivered++;
              else if (s === 'returned' || s === 'returns') returns++;

              if (s !== 'delivered' && s !== 'returned' && s !== 'cancelled') {
                if (!latestActiveOrder) latestActiveOrder = o;
              }
            });

            if (!latestActiveOrder && orders.length > 0) {
              latestActiveOrder = orders[0];
            }

            setOrderStats({ processing, shipped, delivered, returns });
            setActiveOrder(latestActiveOrder);
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to fetch profile data:", error);
          if (isActive) setLoading(false);
        }
      };

      fetchProfileData();
      return () => { isActive = false; };
    }, [user])
  );

  const handleComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} will be available soon!`, [{ text: 'OK' }]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  // Generate initials
  const initials = user?.username 
    ? user.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const renderSectionHeader = (title: string, actionText?: string, onAction?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionText && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionText} <Ionicons name="chevron-forward" size={12} /></Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderOrderStat = (icon: keyof typeof MaterialCommunityIcons.glyphMap, label: string, count: number, route: any) => (
    <TouchableOpacity style={styles.orderStatItem} onPress={() => router.push(route)}>
      <View style={styles.orderStatIconBox}>
        <MaterialCommunityIcons name={icon} size={28} color="#850404" />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={styles.orderStatLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderListItem = (icon: keyof typeof Ionicons.glyphMap, title: string, route: any, subtitle?: string, isLast = false) => (
    <TouchableOpacity style={[styles.listItem, !isLast && styles.listItemBorder]} onPress={() => router.push(route)}>
      <View style={styles.listIconContainer}>
        <Ionicons name={icon} size={22} color="#850404" />
      </View>
      <View style={styles.listTextContainer}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle && <Text style={styles.listSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {user ? (
          <>
            {/* Red Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileCardInner}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>{user.username}</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#F9D976" style={styles.verifiedIcon} />
                  </View>
                  <Text style={styles.profileContact}>{user.phoneNumber || user.email}</Text>
                  <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.watermarkContainer}>
                  <Text style={styles.watermarkText}>Tradition{'\n'}Wears{'\n'}A Brighter{'\n'}Tomorrow</Text>
                </View>
              </View>
            </View>

            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#850404" />
              </View>
            ) : (
              <>
                {/* My Orders */}
                <View style={styles.section}>
                  {renderSectionHeader('My Orders', 'View all', () => router.push('/orders'))}
                  
                  <View style={styles.orderStatsRow}>
                    {renderOrderStat('package-variant', 'Processing', orderStats.processing, '/orders?status=processing')}
                    {renderOrderStat('truck-delivery-outline', 'Shipped', orderStats.shipped, '/orders?status=shipped')}
                    {renderOrderStat('checkbox-marked-outline', 'Delivered', orderStats.delivered, '/orders?status=delivered')}
                    {renderOrderStat('keyboard-return', 'Returns', orderStats.returns, '/orders?status=returns')}
                  </View>

                  {/* Active Order Card */}
                  {activeOrder && (
                    <View style={styles.activeOrderCard}>
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderProductName} numberOfLines={1}>
                          Order #{activeOrder.orderNumber || activeOrder.id?.substring(0,8)}
                        </Text>
                        <Text style={styles.orderId}>Placed on {new Date(activeOrder.createdAt).toLocaleDateString()}</Text>
                        <View style={styles.orderStatusRow}>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{activeOrder.status}</Text>
                          </View>
                          <Text style={styles.orderDate}>Total: ₹{activeOrder.totalAmount}</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.trackButton} onPress={() => router.push('/track-order')}>
                        <Text style={styles.trackButtonText}>Track Order</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.guestState}>
            <Ionicons name="person-circle-outline" size={80} color="#850404" />
            <Text style={styles.guestTitle}>Welcome to Prabha Tex</Text>
            <Text style={styles.guestSubtitle}>Sign in to view your profile, track orders, and manage your account.</Text>
            <TouchableOpacity style={styles.guestButton} onPress={() => router.push('/login')}>
              <Text style={styles.guestButtonText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitlePlain}>Account</Text>
          <View style={styles.listCard}>
            {renderListItem('location-outline', 'Saved Addresses', '/addresses', `${addressCount} delivery address${addressCount === 1 ? '' : 'es'}`)}
            {renderListItem('heart-outline', 'Wishlist', '/wishlist', `${wishlist.length} saved item${wishlist.length === 1 ? '' : 's'}`, true)}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitlePlain}>Support & More</Text>
          <View style={styles.listCard}>
            {renderListItem('headset-outline', 'Help & Support', '/support')}
            {renderListItem('document-text-outline', 'Policies', '/policies')}
            {renderListItem('information-circle-outline', 'About Prabha Tex', '/about', undefined, true)}
          </View>
        </View>

        {/* Log Out */}
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0', // off-white warm background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F6F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#850404',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E53935',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F8F6F0',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  profileCard: {
    marginBottom: 32,
  },
  profileCardInner: {
    backgroundColor: '#6A0C0B',
    borderRadius: 16,
    padding: 20,
    paddingBottom: 45, // extra space for overlapping privilege card
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#6A0C0B',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    zIndex: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    color: '#F9D976',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  profileContact: {
    color: '#EBD197',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
    opacity: 0.9,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBD197',
  },
  editButtonText: {
    color: '#EBD197',
    fontSize: 12,
    fontWeight: '500',
  },
  watermarkContainer: {
    position: 'absolute',
    right: 16,
    top: 20,
    opacity: 0.5,
    zIndex: 1,
  },
  watermarkText: {
    color: '#D4B872',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  privilegeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: -20,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  privilegeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5E6D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  privilegeEyebrow: {
    fontSize: 9,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  privilegeTier: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  privilegeProgress: {
    flex: 1,
    marginLeft: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#850404',
  },
  viewRewardsText: {
    fontSize: 10,
    color: '#850404',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#EAEAEA',
    borderRadius: 2,
    width: '80%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#850404',
    borderRadius: 2,
  },
  pointsTarget: {
    position: 'absolute',
    right: 0,
    bottom: -2,
    fontSize: 9,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionTitlePlain: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 13,
    color: '#850404',
    fontWeight: '600',
  },
  orderStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderStatItem: {
    alignItems: 'center',
    width: '23%',
  },
  orderStatIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(133, 4, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: '#FFF',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#850404',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  orderStatLabel: {
    fontSize: 11,
    color: '#444',
    fontWeight: '500',
  },
  activeOrderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EBE1',
    position: 'relative',
  },
  orderImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    paddingRight: 80, // space for track button
  },
  orderId: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  orderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 10,
    color: '#666',
  },
  trackButton: {
    position: 'absolute',
    right: 12,
    top: 30, // vertically center aligned roughly
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#850404',
  },
  trackButtonText: {
    color: '#850404',
    fontSize: 11,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  listIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#850404',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#850404',
    fontSize: 15,
    fontWeight: '600',
  },
  guestState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#850404',
    marginTop: 16,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  guestButton: {
    backgroundColor: '#850404',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  guestButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerSpace: {
    height: 60,
  },
});
