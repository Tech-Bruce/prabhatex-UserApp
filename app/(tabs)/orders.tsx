import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/axiosInstance';

export default function OrdersScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Convert query param "status" (e.g. "processing") to capitalized string or "All"
  const initialStatus = params.status 
    ? (params.status as string).charAt(0).toUpperCase() + (params.status as string).slice(1)
    : 'All';

  const [activeTab, setActiveTab] = useState(initialStatus);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchOrders = async () => {
        try {
          const res = await api.get('/my-orders');
          if (isActive) {
            setOrders(res.data.orders || []);
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error);
          if (isActive) setLoading(false);
        }
      };
      fetchOrders();
      return () => { isActive = false; };
    }, [])
  );

  const tabs = ['All', 'Processing', 'Shipped', 'Delivered', 'Returns'];

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'All') return true;
    const s = o.status?.toLowerCase() || '';
    const t = activeTab.toLowerCase();
    if (t === 'processing' && (s === 'processing' || s === 'pending')) return true;
    if (t === 'shipped' && s === 'shipped') return true;
    if (t === 'delivered' && s === 'delivered') return true;
    if (t === 'returns' && (s === 'returns' || s === 'returned')) return true;
    return false;
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Stack.Screen options={{ title: 'My Orders', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#850404" style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No orders found in this category.</Text>
          </View>
        ) : (
          filteredOrders.map(order => {
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
            const product = firstItem?.product;
            let imageUrl = 'https://images.unsplash.com/photo-1610189013658-48b94f6c4df1?auto=format&fit=crop&w=300&q=80'; // fallback
            if (product?.productImages) {
              try {
                const parsed = JSON.parse(product.productImages);
                if (parsed && parsed.length > 0) imageUrl = parsed[0];
              } catch (e) {
                if (typeof product.productImages === 'string' && product.productImages.startsWith('http')) {
                  imageUrl = product.productImages;
                } else if (Array.isArray(product.productImages) && product.productImages.length > 0) {
                  imageUrl = product.productImages[0];
                }
              }
            }

            const productName = product ? product.productName : `Order #${order.orderNumber}`;
            const s = order.status?.toLowerCase() || '';
            const displayStatus = s.charAt(0).toUpperCase() + s.slice(1);

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{order.orderNumber || order.id.substring(0,8)}</Text>
                  <View style={[styles.statusBadge, displayStatus === 'Delivered' && styles.statusDelivered, displayStatus === 'Returned' && styles.statusReturned]}>
                    <Text style={[styles.statusText, displayStatus === 'Delivered' && styles.statusDeliveredText, displayStatus === 'Returned' && styles.statusReturnedText]}>
                      {displayStatus}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.orderContent}>
                  <Image source={{ uri: imageUrl }} style={styles.orderImage} />
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderName} numberOfLines={2}>{productName}</Text>
                    <Text style={styles.orderPrice}>₹{order.totalAmount}</Text>
                    <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <TouchableOpacity style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                  {order.awbNo && (s === 'processing' || s === 'pending' || s === 'shipped') && (
                    <TouchableOpacity style={styles.trackButton} onPress={() => router.push({
                        pathname: '/track-order',
                        params: {
                          awbNo: order.awbNo,
                          orderNumber: order.orderNumber || order.id.substring(0,8),
                          productName: productName,
                          imageUrl: imageUrl,
                          price: order.totalAmount,
                          qty: firstItem?.quantity || 1
                        }
                      })}>
                      <Text style={styles.trackButtonText}>Track Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  tabsContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE1',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#850404',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  statusDelivered: { backgroundColor: '#E8F5E9' },
  statusDeliveredText: { color: '#2E7D32' },
  statusReturned: { backgroundColor: '#FFEBEE' },
  statusReturnedText: { color: '#C62828' },
  orderContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  orderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#850404',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  trackButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#850404',
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#888',
  },
});
