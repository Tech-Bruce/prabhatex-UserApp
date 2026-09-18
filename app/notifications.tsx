import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NOTIFICATIONS = [
  { id: '1', title: 'Order Shipped!', message: 'Your order #PTT0135 has been shipped and is on the way.', time: '2 hours ago', type: 'order', isRead: false },
  { id: '2', title: 'Flash Sale Alert', message: 'Get up to 50% off on Kanchipuram Silks. Limited time offer!', time: 'Yesterday', type: 'promo', isRead: false },
  { id: '3', title: 'Order Delivered', message: 'Your order #PTT0120 was successfully delivered.', time: '1 Sep', type: 'order', isRead: true },
  { id: '4', title: 'Welcome to Prabha Tex', message: 'Thanks for joining us! Here is a 10% coupon for your first order.', time: '20 Aug', type: 'system', isRead: true },
];

export default function NotificationsScreen() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return 'cube-outline';
      case 'promo': return 'pricetag-outline';
      default: return 'notifications-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {NOTIFICATIONS.map((notif) => (
          <TouchableOpacity key={notif.id} style={[styles.notificationCard, !notif.isRead && styles.unreadCard]}>
            <View style={[styles.iconContainer, !notif.isRead && styles.unreadIconContainer]}>
              <Ionicons name={getIcon(notif.type)} size={20} color={notif.isRead ? "#888" : "#850404"} />
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, !notif.isRead && styles.unreadTitle]}>{notif.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
              <Text style={styles.time}>{notif.time}</Text>
            </View>
            {!notif.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
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
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: '#FFFDF9',
    borderColor: 'rgba(133, 4, 4, 0.2)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadIconContainer: {
    backgroundColor: '#FDECEC',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#333',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#850404',
    marginTop: 6,
    marginLeft: 8,
  },
});
