import React, { useState, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
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

  const [addressCount, setAddressCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfileData = async () => {
        if (!user) {
          setLoading(false);
          return;
        }
        try {
          const [ordersRes, addressRes] = await Promise.all([
            api.get('/my-orders').catch(() => ({ data: { orders: [] } })),
            api.get('/address').catch(() => ({ data: { data: [] } })),
          ]);

          if (isActive) {
            const orders = ordersRes.data.orders || [];
            const addresses = addressRes.data.data || [];
            
            setAddressCount(addresses.length);
            setOrderCount(orders.length);
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
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Generate initials
  const initials = user?.username 
    ? user.username.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';



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

            {loading && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#850404" />
              </View>
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
            {renderListItem(
              'bag-handle-outline',
              'My Orders',
              '/orders',
              user ? (orderCount > 0 ? `${orderCount} order${orderCount === 1 ? '' : 's'} placed` : 'View order history & track items') : 'Sign in to view orders'
            )}
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

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isLoggingOut && setShowLogoutModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => !isLoggingOut && setShowLogoutModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={28} color="#850404" />
            </View>

            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out of your Prabha Tex account?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  sectionTitlePlain: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
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
    height: 110,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE0DF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#F3F1ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#44403C',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#850404',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#850404',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
