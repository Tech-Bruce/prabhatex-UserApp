import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/src/context/CartContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/400';
    if (url.startsWith('/')) {
      const baseHost = 'http://10.93.111.50:8080';
      return `${baseHost}${url}`;
    }
    return url;
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Shopping Bag', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' }, headerTitleStyle: { fontWeight: '700', fontSize: 20 } }} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={64} color="#D2A127" />
          </View>
          <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
          <Text style={styles.emptySubtitle}>Explore our premium collections and add items to your cart.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.shopBtnText}>EXPLORE PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Removed Tax
  const finalTotal = totalPrice;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: `Shopping Bag (${totalItems})`, headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' }, headerTitleStyle: { fontWeight: '700', fontSize: 18 } }} />
      
      {/* ScrollView now has flex: 1 to ensure the bottom bar stays sticky */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {cart.map((item) => (
          <View key={`${item.id}-${item.size}`} style={styles.cartItem}>
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.itemImage} />
            
            <View style={styles.itemDetails}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id, item.cartId)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Ionicons name="close-circle" size={24} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.itemVariant}>Size: {item.size || 'N/A'}</Text>
              
              <View style={styles.priceAndQty}>
                <Text style={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                
                <View style={styles.qtyContainer}>
                  <TouchableOpacity 
                    style={styles.stepperBtn} 
                    onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.cartId)}
                  >
                    <Ionicons name="remove" size={16} color="#555" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.stepperBtn} 
                    onPress={() => updateQuantity(item.id, Math.min(item.maxStock || 10, item.quantity + 1), item.cartId)}
                  >
                    <Ionicons name="add" size={16} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>PRICE DETAILS</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
            <Text style={styles.summaryValue}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charges</Text>
            <Text style={styles.summaryValueFree}>Calculated at checkout</Text>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.secureContainer}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          <Text style={styles.secureText}>100% Secure & Safe Payments</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalCol}>
          <Text style={styles.bottomTotalLabel}>Grand Total</Text>
          <Text style={styles.bottomTotalValue}>₹{finalTotal.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>CHECKOUT</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F0' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFDF9', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#F2D588' },
  emptyTitle: { fontSize: 24, fontWeight: '600', color: '#212121', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  shopBtn: { marginTop: 32, backgroundColor: '#850404', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30, shadowColor: '#850404', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  shopBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 1.5 },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  cartItem: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  itemImage: { width: 90, height: 110, borderRadius: 10, marginRight: 14, backgroundColor: '#F5F5F5' },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#212121', marginRight: 12, lineHeight: 22 },
  itemVariant: { fontSize: 13, color: '#757575', marginTop: 4 },
  
  priceAndQty: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  itemPrice: { fontSize: 18, fontWeight: 'bold', color: '#850404' },
  
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 20, borderWidth: 1, borderColor: '#EAEAEA', paddingHorizontal: 4, paddingVertical: 4 },
  stepperBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  stepperValue: { width: 32, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#212121' },
  
  summaryCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  summaryTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, color: '#9E9E9E', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  summaryLabel: { fontSize: 14, color: '#616161' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#212121' },
  summaryValueFree: { fontSize: 14, fontWeight: '500', color: '#D2A127' },
  divider: { height: 1, backgroundColor: '#EEEEEE', borderStyle: 'dashed', marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#850404' },
  
  secureContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 10 },
  secureText: { fontSize: 12, color: '#4CAF50', fontWeight: '500', marginLeft: 6 },
  
  bottomBar: { flexDirection: 'row', padding: 16, paddingBottom: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  bottomTotalCol: { flex: 1 },
  bottomTotalLabel: { fontSize: 12, color: '#757575', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  bottomTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#212121' },
  checkoutBtn: { backgroundColor: '#850404', flexDirection: 'row', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#850404', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  checkoutBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});
