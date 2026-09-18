import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/utils/axiosInstance';
import Toast from 'react-native-toast-message';
import {
  CFPaymentGatewayService,
  CFErrorResponse,
} from 'react-native-cashfree-pg-sdk';
import {
  CFSession,
  CFEnvironment,
} from 'cashfree-pg-api-contract';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  // Accordion state
  const [activeStep, setActiveStep] = useState<number>(2); // Default to Step 2 (Delivery Address)

  // Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Delivery Charge
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);

  // New / Edit Address Form
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ fullName: '', phoneNumber: '', street: '', city: '', state: '', zipCode: '' });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Email & Order placement
  const [checkoutEmail, setCheckoutEmail] = useState(user?.email || '');
  const [placingOrder, setPlacingOrder] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    const onVerify = async (orderID: string) => {
      try {
        console.log('Payment: SDK onVerify triggered for order ID:', orderID);
        // Call backend verification
        const verifyRes = await api.post('/payment/verify-payment', {
          orderId: orderID,
          emailForConfirmation: checkoutEmail,
        });
        
        if (verifyRes.data.success) {
          console.log('Payment Success: Verification successful', verifyRes.data);
          await clearCart();
          Toast.show({ type: 'success', text1: 'Payment Successful', text2: 'Your order was placed!' });
          router.replace('/(tabs)/profile');
        } else {
          console.error('Payment Error: Verification failed', verifyRes.data);
          Toast.show({ type: 'error', text1: 'Verification Failed', text2: 'Order verification failed.' });
          setPlacingOrder(false);
        }
      } catch (err: any) {
        console.error('Payment Error: Exception during verification', err.response?.data || err.message);
        Toast.show({ type: 'error', text1: 'Verification Error', text2: err.response?.data?.message || 'Failed to verify payment.' });
        setPlacingOrder(false);
      }
    };

    const onError = (error: CFErrorResponse, orderID: string) => {
      console.error('Payment Error: SDK onError triggered', error.getMessage(), orderID);
      Toast.show({ type: 'error', text1: 'Payment Failed', text2: error.getMessage() || 'Payment was cancelled or failed.' });
      setPlacingOrder(false);
    };

    try {
      CFPaymentGatewayService.setCallback({ onVerify, onError });
    } catch (e: any) {
      console.warn('Cashfree SDK is not linked. This happens if you are using Expo Go instead of a dev build.');
    }

    return () => {
      try {
        CFPaymentGatewayService.removeCallback();
      } catch (e) {
        // ignore
      }
    };
  }, [checkoutEmail, clearCart, router]);

  // Fetch addresses on mount
  useEffect(() => {
    if (!user) {
      Toast.show({ type: 'error', text1: 'Login Required', text2: 'Please log in to checkout.' });
      router.replace('/(tabs)/profile');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const res = await api.get('/address');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAddresses(res.data.data);
          if (res.data.data.length > 0) {
            const defaultAddr = res.data.data.find((a: any) => a.isDefault);
            setSelectedAddressId(defaultAddr ? defaultAddr.id : res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch addresses', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [user]);

  // Calculate Delivery Cost when address changes
  useEffect(() => {
    const calculateDelivery = async () => {
      if (!selectedAddressId || cart.length === 0) return;
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (!addr) return;

      let weightInGrams = cart.length * 1000;

      try {
        setCalculatingDelivery(true);
        const res = await api.post('/delivery-charges/calculate', {
          state: addr.state,
          weightInGrams,
          orderAmount: totalPrice
        });
        if (res.data?.success) {
          setDeliveryCharge(res.data.deliveryCharge || 0);
        }
      } catch (err) {
        console.error('Failed to calc delivery', err);
        setDeliveryCharge(0);
      } finally {
        setCalculatingDelivery(false);
      }
    };

    calculateDelivery();
  }, [selectedAddressId, cart, totalPrice, addresses]);

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/400';
    if (url.startsWith('/')) {
      return `http://10.93.111.50:8080${url}`;
    }
    return url;
  };

  const handleSaveNewAddress = async () => {
    if (!newAddress.fullName || !newAddress.phoneNumber || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all address fields' });
      return;
    }

    try {
      setLoadingAddresses(true);
      if (editingAddressId) {
        const res = await api.put(`/address/${editingAddressId}`, newAddress);
        if (res.data?.success) {
          setAddresses(addresses.map(a => a.id === editingAddressId ? res.data.data : a));
          setSelectedAddressId(res.data.data.id);
          setShowNewAddress(false);
          setEditingAddressId(null);
          setNewAddress({ fullName: '', phoneNumber: '', street: '', city: '', state: '', zipCode: '' });
          Toast.show({ type: 'success', text1: 'Address Updated' });
        }
      } else {
        const res = await api.post('/address', newAddress);
        if (res.data?.success) {
          setAddresses([...addresses, res.data.data]);
          setSelectedAddressId(res.data.data.id);
          setShowNewAddress(false);
          setNewAddress({ fullName: '', phoneNumber: '', street: '', city: '', state: '', zipCode: '' });
          Toast.show({ type: 'success', text1: 'Address Added' });
        }
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save address' });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleEditAddress = (addr: any) => {
    setNewAddress({
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
    });
    setEditingAddressId(addr.id);
    setShowNewAddress(true);
  };

  const handleInitPayment = async () => {
    if (!selectedAddressId) {
      Toast.show({ type: 'error', text1: 'No Address', text2: 'Please select a shipping address' });
      return;
    }
    if (!checkoutEmail) {
      Toast.show({ type: 'error', text1: 'Email Required', text2: 'Please provide an email for order confirmation.' });
      setActiveStep(3);
      return;
    }

    try {
      setSendingOtp(true);
      const phoneToVerify = user?.phoneNumber || addresses.find(a => a.id === selectedAddressId)?.phoneNumber;
      
      const res = await api.post('/send-otp', { phoneNumber: phoneToVerify });
      if (res.data?.success) {
        setShowOtpModal(true);
        if (res.data.devOtpCode) {
          Toast.show({ type: 'info', text1: 'DEV MODE: OTP Generated', text2: `Your OTP is: ${res.data.devOtpCode}`, visibilityTime: 8000 });
        } else {
          Toast.show({ type: 'success', text1: 'OTP Sent', text2: `Sent to ${phoneToVerify}` });
        }
      } else {
        Toast.show({ type: 'error', text1: 'OTP Failed', text2: res.data?.message || 'Could not send OTP' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'OTP Error', text2: err.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please enter the 6-digit code' });
      return;
    }

    try {
      setVerifyingOtp(true);
      const phoneToVerify = user?.phoneNumber || addresses.find(a => a.id === selectedAddressId)?.phoneNumber;
      const res = await api.post('/verify-otp', { phoneNumber: phoneToVerify, code: otpCode });
      
      if (res.data?.success) {
        setShowOtpModal(false);
        proceedToCreateOrder();
      } else {
        Toast.show({ type: 'error', text1: 'Invalid OTP', text2: res.data?.message || 'Verification failed' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Verification Error', text2: err.response?.data?.message || 'Failed to verify OTP' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const proceedToCreateOrder = async () => {
    try {
      setPlacingOrder(true);
      console.log('Payment: Attempting to create order with address ID:', selectedAddressId);
      const resOrder = await api.post('/payment/create-order', { addressId: selectedAddressId });
      
      if (!resOrder.data?.success) {
        console.error('Payment Error: Failed to create order', resOrder.data);
        Toast.show({ type: 'error', text1: 'Order Failed', text2: resOrder.data?.message || 'Failed to create order' });
        setPlacingOrder(false);
        return;
      }

      const { data } = resOrder.data;
      console.log('Payment Success: Order created successfully', data);

      // Start Cashfree Payment
      try {
        const session = new CFSession(
          data.paymentSessionId,
          data.cashfreeOrderId,
          CFEnvironment.SANDBOX
        );

        CFPaymentGatewayService.doWebPayment(session);
      } catch (e: any) {
        console.error('Cashfree SDK Error:', e.message);
        Toast.show({ type: 'error', text1: 'Payment Error', text2: 'Failed to open payment gateway' });
        setPlacingOrder(false);
      }

    } catch (err: any) {
      console.error('Payment Error: Exception during create order', err.response?.data || err.message);
      console.error('Checkout Error:', err.response?.data || err.message);
      Toast.show({ type: 'error', text1: 'Order Failed', text2: err.response?.data?.message || err.message || 'Something went wrong.' });
      setPlacingOrder(false);
    }
  };

  const finalTotal = totalPrice + deliveryCharge;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
      <Stack.Screen options={{ title: 'Complete Your Order', headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>

          <Text style={styles.secureText}>SECURE CHECKOUT</Text>
          <Text style={styles.titleText}>Complete Your Order</Text>

          {/* STEP 1: LOGIN */}
          <TouchableOpacity style={[styles.accordion, activeStep === 1 && styles.accordionActive]} onPress={() => setActiveStep(1)}>
            <View style={styles.accordionHeader}>
              <View style={styles.stepCircle}><Text style={styles.stepCircleText}>1</Text></View>
              <Text style={styles.stepTitle}>STEP 1 - LOGIN</Text>
              {user && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>VERIFIED</Text></View>}
            </View>
            {activeStep === 1 && (
              <View style={styles.accordionContent}>
                <Text style={styles.loginName}>{user?.username || 'User'}</Text>
                <Text style={styles.loginEmail}>{user?.email || user?.phoneNumber}</Text>
                <TouchableOpacity style={styles.continueBtn} onPress={() => setActiveStep(2)}>
                  <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* STEP 2: DELIVERY ADDRESS */}
          <TouchableOpacity style={[styles.accordion, activeStep === 2 && styles.accordionActive]} onPress={() => setActiveStep(2)}>
            <View style={styles.accordionHeader}>
              <View style={styles.stepCircle}><Text style={styles.stepCircleText}>2</Text></View>
              <Text style={styles.stepTitle}>STEP 2 - DELIVERY ADDRESS</Text>
            </View>
            {activeStep === 2 && (
              <View style={styles.accordionContent}>
                {loadingAddresses && !showNewAddress ? (
                  <ActivityIndicator size="small" color="#850404" />
                ) : (
                  <>
                    <TouchableOpacity style={styles.addAddressBtn} onPress={() => {
                      setNewAddress({ fullName: '', phoneNumber: '', street: '', city: '', state: '', zipCode: '' });
                      setEditingAddressId(null);
                      setShowNewAddress(!showNewAddress);
                    }}>
                      <Ionicons name={showNewAddress && !editingAddressId ? "close-circle-outline" : "add-circle-outline"} size={20} color="#850404" />
                      <Text style={styles.addAddressText}>{showNewAddress && !editingAddressId ? "CANCEL" : "ADD NEW ADDRESS"}</Text>
                    </TouchableOpacity>

                    {showNewAddress && (
                      <View style={styles.newAddressForm}>
                        <Text style={styles.formTitle}>{editingAddressId ? 'Edit Address' : 'New Address'}</Text>
                        <TextInput style={styles.input} placeholder="Full Name" value={newAddress.fullName} onChangeText={(t) => setNewAddress(prev => ({...prev, fullName: t}))} />
                        <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={newAddress.phoneNumber} onChangeText={(t) => setNewAddress(prev => ({...prev, phoneNumber: t}))} />
                        <TextInput style={styles.input} placeholder="Street Address" value={newAddress.street} onChangeText={(t) => setNewAddress(prev => ({...prev, street: t}))} />
                        <View style={styles.row}>
                          <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="City" value={newAddress.city} onChangeText={(t) => setNewAddress(prev => ({...prev, city: t}))} />
                          <TextInput style={[styles.input, { flex: 1 }]} placeholder="State" value={newAddress.state} onChangeText={(t) => setNewAddress(prev => ({...prev, state: t}))} />
                        </View>
                        <TextInput style={styles.input} placeholder="Zip Code" keyboardType="number-pad" value={newAddress.zipCode} onChangeText={(t) => setNewAddress(prev => ({...prev, zipCode: t}))} />
                        
                        <View style={styles.formActions}>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewAddress(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNewAddress}><Text style={styles.saveBtnText}>Save Address</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {addresses.map((addr) => (
                      <TouchableOpacity 
                        key={addr.id} 
                        style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardSelected]}
                        onPress={() => setSelectedAddressId(addr.id)}
                      >
                        <View style={styles.radioContainer}>
                          <Ionicons name={selectedAddressId === addr.id ? "radio-button-on" : "radio-button-off"} size={20} color={selectedAddressId === addr.id ? "#850404" : "#CCC"} />
                        </View>
                        <View style={styles.addressDetails}>
                          <Text style={styles.addressName}>{addr.fullName} <Text style={styles.addressPhone}>{addr.phoneNumber}</Text></Text>
                          <Text style={styles.addressText}>{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</Text>
                          
                          {selectedAddressId === addr.id && (
                            <View style={styles.addressActionRow}>
                              <TouchableOpacity style={styles.deliverHereBtn} onPress={() => setActiveStep(3)}>
                                <Text style={styles.deliverHereText}>DELIVER HERE</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.editBtn} onPress={() => handleEditAddress(addr)}>
                                <Ionicons name="pencil" size={14} color="#777" />
                                <Text style={styles.editBtnText}>EDIT</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* STEP 3: ORDER SUMMARY */}
          <TouchableOpacity style={[styles.accordion, activeStep === 3 && styles.accordionActive]} onPress={() => setActiveStep(3)}>
            <View style={styles.accordionHeader}>
              <View style={styles.stepCircle}><Text style={styles.stepCircleText}>3</Text></View>
              <Text style={styles.stepTitle}>STEP 3 - ORDER SUMMARY</Text>
            </View>
            {activeStep === 3 && (
              <View style={styles.accordionContent}>
                {cart.map((item) => (
                  <View key={`${item.id}-${item.size}`} style={styles.summaryItem}>
                    <Image source={{ uri: getImageUrl(item.image) }} style={styles.summaryItemImage} />
                    <View style={styles.summaryItemDetails}>
                      <Text style={styles.summaryItemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.summaryItemMeta}>Size: {item.size || 'N/A'}  |  Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.summaryItemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                {/* Email Collection Area */}
                <View style={styles.emailContainer}>
                  <Text style={styles.emailLabel}>Order Confirmation Email</Text>
                  <Text style={styles.emailSubtext}>We'll send your receipt and tracking details here.</Text>
                  <TextInput 
                    style={styles.emailInput}
                    placeholder="Enter your email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={checkoutEmail}
                    onChangeText={setCheckoutEmail}
                  />
                </View>

                <TouchableOpacity style={styles.continueBtn} onPress={() => setActiveStep(4)}>
                  <Text style={styles.continueBtnText}>Continue to Payment</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* STEP 4: PAYMENT */}
          <TouchableOpacity style={[styles.accordion, activeStep === 4 && styles.accordionActive]} onPress={() => setActiveStep(4)}>
            <View style={styles.accordionHeader}>
              <View style={styles.stepCircle}><Text style={styles.stepCircleText}>4</Text></View>
              <Text style={styles.stepTitle}>STEP 4 - PAYMENT</Text>
            </View>
            {activeStep === 4 && (
              <View style={styles.accordionContent}>
                <View style={styles.priceDetailsCard}>
                  <Text style={styles.priceDetailsTitle}>Price Details</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
                    <Text style={styles.summaryValue}>₹{totalPrice}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery</Text>
                    {calculatingDelivery ? (
                      <ActivityIndicator size="small" color="#850404" />
                    ) : (
                      <Text style={styles.summaryValue}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</Text>
                    )}
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Taxes & Duties</Text>
                    <Text style={styles.summaryValueLight}>Included</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{finalTotal}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.payBtn} 
                  disabled={sendingOtp || placingOrder || calculatingDelivery || !selectedAddressId}
                  onPress={handleInitPayment}
                >
                  {sendingOtp || placingOrder ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.payBtnText}>VERIFY & PAY ₹{finalTotal}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowOtpModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.modalIconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color="#850404" />
            </View>
            <Text style={styles.modalTitle}>Verification Required</Text>
            <Text style={styles.modalSubtext}>
              Please enter the 6-digit OTP sent to your phone number to confirm your order.
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
            />

            <TouchableOpacity 
              style={styles.verifyBtn} 
              disabled={verifyingOtp || otpCode.length < 6}
              onPress={handleVerifyOtp}
            >
              {verifyingOtp ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.verifyBtnText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F0' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  secureText: { fontSize: 10, fontWeight: 'bold', color: '#D2A127', letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' },
  titleText: { fontSize: 24, fontWeight: 'bold', color: '#212121', marginBottom: 24 },
  
  accordion: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0EBE1', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  accordionActive: { borderColor: '#D2A127', shadowOpacity: 0.06, elevation: 4 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#212121', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepCircleText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  stepTitle: { fontSize: 13, fontWeight: 'bold', color: '#212121', letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  verifiedBadge: { backgroundColor: '#FFF9E6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: '#F2D588' },
  verifiedText: { fontSize: 10, fontWeight: 'bold', color: '#B37D12', letterSpacing: 0.5 },
  
  accordionContent: { padding: 16, paddingTop: 4, borderTopWidth: 0 },
  
  loginName: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  loginEmail: { fontSize: 14, color: '#666', marginBottom: 12 },
  
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingVertical: 8 },
  addAddressText: { color: '#850404', fontWeight: 'bold', fontSize: 12, letterSpacing: 1, marginLeft: 8 },
  
  newAddressForm: { backgroundColor: '#FAFAFA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', marginBottom: 16 },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 16 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 14, color: '#333' },
  row: { flexDirection: 'row', gap: 12 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#666', fontWeight: '600', fontSize: 13 },
  saveBtn: { backgroundColor: '#850404', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  
  addressCard: { flexDirection: 'row', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EAEAEA', backgroundColor: '#FAFAFA' },
  addressCardSelected: { borderColor: '#850404', backgroundColor: '#FFFDFD' },
  radioContainer: { marginRight: 12, marginTop: 2 },
  addressDetails: { flex: 1 },
  addressName: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  addressPhone: { fontSize: 13, color: '#666', fontWeight: '600', marginLeft: 8 },
  addressText: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 12 },
  addressActionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  deliverHereBtn: { backgroundColor: '#212121', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginRight: 16 },
  deliverHereText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  editBtnText: { color: '#666', fontSize: 12, fontWeight: '600', marginLeft: 4 },

  summaryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  summaryItemImage: { width: 50, height: 65, borderRadius: 8, backgroundColor: '#F5F5F5', marginRight: 12 },
  summaryItemDetails: { flex: 1, justifyContent: 'center' },
  summaryItemName: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 4, lineHeight: 20 },
  summaryItemMeta: { fontSize: 12, color: '#777' },
  summaryItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#850404', marginLeft: 12 },

  emailContainer: { marginTop: 12, marginBottom: 8, backgroundColor: '#FAFAFA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA' },
  emailLabel: { fontSize: 13, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  emailSubtext: { fontSize: 12, color: '#777', marginBottom: 12 },
  emailInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14 },

  continueBtn: { backgroundColor: '#212121', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  continueBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  priceDetailsCard: { backgroundColor: '#FAFAFA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', marginBottom: 24 },
  priceDetailsTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#212121' },
  summaryValueLight: { fontSize: 14, color: '#888' },
  divider: { height: 1, backgroundColor: '#E0E0E0', borderStyle: 'dashed', marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#850404' },

  payBtn: { backgroundColor: '#850404', paddingVertical: 16, borderRadius: 8, alignItems: 'center', shadowColor: '#850404', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  payBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalCloseIcon: { position: 'absolute', top: 16, right: 16, padding: 4 },
  modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FDF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#212121', marginBottom: 8 },
  modalSubtext: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  otpInput: { width: '100%', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 16, fontSize: 24, textAlign: 'center', letterSpacing: 8, fontWeight: 'bold', marginBottom: 24, color: '#212121' },
  verifyBtn: { width: '100%', backgroundColor: '#850404', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
