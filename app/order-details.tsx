import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '@/src/utils/axiosInstance';
import {
  deriveMilestoneAndSteps,
  TrackingSummary,
} from '@/src/utils/trackingStatus';

interface OrderItem {
  id?: string;
  quantity: number;
  price: number | string;
  refundStatus?: string;
  refundAmount?: number | string;
  product?: {
    id?: string;
    productName: string;
    productImages?: string | string[];
    price?: number | string;
  };
}

interface OrderData {
  id: string;
  orderNumber?: string;
  status: string;
  refundStatus?: string;
  totalRefunded?: number | string;
  refundHistory?: any[];
  shippingStatus?: string;
  totalAmount: number | string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  awbNo?: string;
  courierName?: string;
  courierPartner?: string;
  courierMeta?: any;
  trackingHistory?: any[];
  shippingAddress?: any;
  items?: OrderItem[];
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [order, setOrder] = useState<OrderData | null>(() => {
    if (params.orderData) {
      try {
        return JSON.parse(params.orderData as string);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(!order);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const orderId = (params.orderId as string) || order?.id;

  // Fetch or refresh order details and courier tracking
  const loadOrderAndTracking = useCallback(async (isManualRefresh = false) => {
    if (!orderId) {
      setError('Order not found');
      setLoading(false);
      return;
    }

    try {
      if (isManualRefresh) setRefreshing(true);
      else if (!order) setLoading(true);

      const res = await api.get('/my-orders');
      if (res.data?.success) {
        const allOrders: OrderData[] = res.data.orders || [];
        const found = allOrders.find(
          (o) => o.id === orderId || o.orderNumber === orderId
        );
        if (found) {
          setOrder(found);
          setError('');

          // If order has an AWB number, fetch live tracking details as well
          if (found.awbNo) {
            try {
              const trackRes = await api.get(`/track/${found.awbNo}`);
              if (trackRes.data?.success && trackRes.data?.tracking) {
                setTracking(trackRes.data.tracking);
              }
            } catch (trackErr) {
              console.warn('Could not fetch tracking for AWB:', found.awbNo, trackErr);
            }
          }
        } else {
          setError('Could not find details for this order.');
        }
      }
    } catch (err: any) {
      console.error('Failed to load order details:', err);
      setError(err?.response?.data?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, order]);

  useEffect(() => {
    loadOrderAndTracking();
  }, []);

  // When order.awbNo exists but tracking isn't fetched yet, fetch it
  useEffect(() => {
    if (order?.awbNo && !tracking) {
      api
        .get(`/track/${order.awbNo}`)
        .then((res) => {
          if (res.data?.success && res.data?.tracking) {
            setTracking(res.data.tracking);
          }
        })
        .catch(() => {});
    }
  }, [order?.awbNo, tracking]);

  const handleShare = async () => {
    if (!order) return;
    try {
      await Share.share({
        message: `Order #${order.orderNumber || order.id.substring(0, 8)} from Prabha Tex - Total: ₹${order.totalAmount}. Status: ${order.status}`,
      });
    } catch {
      // Ignored
    }
  };

  const handleCopyAwb = async (awbText: string) => {
    try {
      await Clipboard.setStringAsync(awbText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy AWB:', e);
    }
  };

  const getProductImage = (product?: OrderItem['product']): string => {
    const fallback =
      'https://images.unsplash.com/photo-1610189013658-48b94f6c4df1?auto=format&fit=crop&w=600&q=80';
    if (!product?.productImages) return fallback;

    if (Array.isArray(product.productImages) && product.productImages.length > 0) {
      return product.productImages[0];
    }

    if (typeof product.productImages === 'string') {
      try {
        const parsed = JSON.parse(product.productImages);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch {
        if (product.productImages.startsWith('http')) return product.productImages;
      }
    }
    return fallback;
  };

  const parseAddress = (shippingAddress: any) => {
    if (!shippingAddress) return null;
    if (typeof shippingAddress === 'string') {
      try {
        return JSON.parse(shippingAddress);
      } catch {
        return { addressLine1: shippingAddress };
      }
    }
    return shippingAddress;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#850404" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={56} color="#DC2626" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorSubtitle}>{error || 'Unable to display order details.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Derive shared normalized tracking summary
  const summary: TrackingSummary = deriveMilestoneAndSteps(order, tracking);

  const address = parseAddress(order.shippingAddress);
  const items = order.items || [];
  const primaryItem = items[0];
  const primaryProduct = primaryItem?.product;

  const displayOrderNum = order.orderNumber || order.id.substring(0, 8).toUpperCase();
  const primaryProductName =
    primaryProduct?.productName ||
    (order.orderNumber ? `Order #${order.orderNumber}` : 'Traditional Handcrafted Saree');
  const primaryProductImage = getProductImage(primaryProduct);

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    return sum + qty * price;
  }, 0);

  const finalTotal = Number(order.totalAmount) || subtotal;
  const shippingFee = finalTotal > subtotal && subtotal > 0 ? finalTotal - subtotal : 0;
  const displayAwb = summary.awbNo || order.awbNo || null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {primaryProductName}
          </Text>
          <Text style={styles.headerSubtitle}>Order #{displayOrderNum}</Text>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => loadOrderAndTracking(true)}
            accessibilityLabel="Refresh order status"
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#850404" />
            ) : (
              <Ionicons name="refresh-outline" size={22} color="#1C1917" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleShare}
            accessibilityLabel="Share order"
          >
            <Ionicons name="share-social-outline" size={22} color="#1C1917" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO SHOWCASE CARD: Product Name, Product Image & Delivery Progress */}
        <View style={styles.heroCard}>
          {/* Header Row: Order Number Badge & Status Pill */}
          <View style={styles.heroHeaderRow}>
            <View style={styles.orderNumberBadge}>
              <Ionicons name="receipt-outline" size={13} color="#850404" />
              <Text style={styles.orderNumberBadgeText}>Order #{displayOrderNum}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {order.refundStatus === 'refunded' ? (
                <View style={[styles.statusBadge, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                  <Ionicons name="refresh-circle-outline" size={14} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={[styles.statusBadgeText, { color: '#dc2626' }]}>Refunded</Text>
                </View>
              ) : order.refundStatus === 'partial' ? (
                <View style={[styles.statusBadge, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                  <Ionicons name="refresh-circle-outline" size={14} color="#b45309" style={{ marginRight: 4 }} />
                  <Text style={[styles.statusBadgeText, { color: '#b45309' }]}>Partially Refunded</Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.statusBadge,
                  summary.isDelivered && styles.statusBadgeDelivered,
                  summary.isUnsuccessfulAttempt && styles.statusBadgeWarning,
                ]}
              >
                <Ionicons
                  name={
                    summary.isDelivered
                      ? 'checkmark-circle'
                      : summary.isOutForDelivery
                      ? 'bicycle'
                      : summary.isUnsuccessfulAttempt
                      ? 'alert-circle'
                      : 'time-outline'
                  }
                  size={14}
                  color={
                    summary.isDelivered
                      ? '#15803D'
                      : summary.isUnsuccessfulAttempt
                      ? '#B45309'
                      : '#850404'
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    summary.isDelivered && styles.statusBadgeTextDelivered,
                    summary.isUnsuccessfulAttempt && styles.statusBadgeTextWarning,
                  ]}
                >
                  {summary.isDelivered
                    ? 'Delivered'
                    : summary.isOutForDelivery
                    ? 'Out for Delivery'
                    : summary.isInTransit
                    ? 'In Transit'
                    : summary.isUnsuccessfulAttempt
                    ? 'Attempted'
                    : 'Processing'}
                </Text>
              </View>
            </View>
          </View>

          {/* Prominent Order / Product Name */}
          <View style={styles.heroTitleContainer}>
            <Text style={styles.heroProductName} numberOfLines={2}>
              {primaryProductName}
            </Text>
            <View style={styles.heroMetaRow}>
              <Text style={styles.heroDateText}>Placed on {orderDate}</Text>
              {items.length > 1 && (
                <View style={styles.multiItemBadge}>
                  <Text style={styles.multiItemBadgeText}>
                    +{items.length - 1} more {items.length > 2 ? 'items' : 'item'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Prominent Product Image Showcase */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={{ uri: primaryProductImage }}
              style={styles.heroProductImage}
              resizeMode="cover"
            />
            {/* Price & Quantity Overlay Pill */}
            <View style={styles.imageOverlayPill}>
              <Text style={styles.imageOverlayPrice}>₹{finalTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.imageOverlayDot}>•</Text>
              <Text style={styles.imageOverlayQty}>
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>

          {/* TRACKING SECTION: Directly Below Product Image */}
          <View style={styles.trackingContainer}>
            {/* PROMINENT STATUS SUMMARY CARD */}
            <View
              style={[
                styles.statusSummaryCard,
                summary.isDelivered && styles.statusSummaryCardDelivered,
                summary.isUnsuccessfulAttempt && styles.statusSummaryCardWarning,
              ]}
            >
              <View style={styles.summaryTopRow}>
                <View
                  style={[
                    styles.summaryIconBox,
                    summary.isDelivered && styles.summaryIconBoxDelivered,
                    summary.isUnsuccessfulAttempt && styles.summaryIconBoxWarning,
                  ]}
                >
                  <Ionicons
                    name={
                      summary.isDelivered
                        ? 'checkmark-circle'
                        : summary.isOutForDelivery
                        ? 'bicycle'
                        : summary.isUnsuccessfulAttempt
                        ? 'alert-circle'
                        : 'cube-outline'
                    }
                    size={22}
                    color={
                      summary.isDelivered
                        ? '#15803D'
                        : summary.isUnsuccessfulAttempt
                        ? '#B45309'
                        : '#850404'
                    }
                  />
                </View>
                <View style={styles.summaryTextCol}>
                  <Text style={styles.summaryHeadline}>{summary.headline}</Text>
                  <Text style={styles.summarySubheadline}>{summary.subheadline}</Text>
                </View>
              </View>

              {/* Location & Last Updated */}
              <View style={styles.summaryMetaDivider} />
              <View style={styles.summaryMetaRow}>
                {summary.latestLocation ? (
                  <View style={styles.summaryMetaItem}>
                    <Ionicons name="location-outline" size={13} color="#78716C" />
                    <Text style={styles.summaryMetaText}>{summary.latestLocation}</Text>
                  </View>
                ) : null}
                {summary.lastUpdatedFormatted ? (
                  <View style={styles.summaryMetaItem}>
                    <Ionicons name="time-outline" size={13} color="#78716C" />
                    <Text style={styles.summaryMetaText}>
                      Updated {summary.lastUpdatedFormatted}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Expected Delivery Date: ONLY when supplied by API */}
              {summary.expectedDeliveryDate ? (
                <View style={styles.expectedDateRow}>
                  <Text style={styles.expectedDateLabel}>Expected Delivery:</Text>
                  <Text style={styles.expectedDateValue}>{summary.expectedDeliveryDate}</Text>
                </View>
              ) : null}
            </View>

            {/* REDESIGNED 5-STEP TIMELINE */}
            <View style={styles.timelineWrapper}>
              <View style={styles.timelineHeaderRow}>
                <Text style={styles.timelineHeaderTitle}>DELIVERY TIMELINE</Text>
                <Text style={styles.timelineHeaderPartner}>{summary.courierName}</Text>
              </View>

              <View style={styles.verticalTimeline}>
                {summary.steps.map((step, idx) => {
                  const isCompleted = step.completed;
                  const isCurrent = step.current;
                  const isDeliveredStep = step.step === 4 && summary.isDelivered;
                  const isLast = idx === summary.steps.length - 1;
                  const stepColor = isDeliveredStep ? '#15803D' : '#850404';

                  return (
                    <View key={step.title} style={styles.timelineRow}>
                      {/* Left: Indicator & Vertical Connecting Line */}
                      <View style={styles.timelineLeftCol}>
                        <View
                          style={[
                            styles.timelineNode,
                            isCompleted && {
                              backgroundColor: stepColor,
                              borderColor: stepColor,
                            },
                            isCurrent && {
                              backgroundColor: stepColor,
                              borderColor: isDeliveredStep ? '#BBF7D0' : '#FCE7E7',
                              borderWidth: 3,
                              transform: [{ scale: 1.05 }],
                            },
                            !isCompleted && !isCurrent && styles.timelineNodePending,
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          ) : isCurrent ? (
                            <Ionicons
                              name={
                                isDeliveredStep
                                  ? 'checkmark-circle'
                                  : step.step === 3
                                  ? 'bicycle'
                                  : step.step === 2
                                  ? 'airplane'
                                  : 'ellipse'
                              }
                              size={12}
                              color="#FFFFFF"
                            />
                          ) : (
                            <View style={styles.timelineNodePendingDot} />
                          )}
                        </View>
                        {!isLast && (
                          <View
                            style={[
                              styles.timelineLine,
                              isCompleted && { backgroundColor: stepColor },
                            ]}
                          />
                        )}
                      </View>

                      {/* Right: Step Content */}
                      <View style={[styles.timelineContent, !isLast && styles.timelineContentSpacing]}>
                        <View style={styles.stepTitleRow}>
                          <Text
                            style={[
                              styles.stepTitle,
                              (isCompleted || isCurrent) && styles.stepTitleActive,
                              isCurrent && { color: stepColor, fontWeight: '700' },
                            ]}
                          >
                            {step.title}
                          </Text>
                          {isCurrent && (
                            <View
                              style={[
                                styles.currentStepBadge,
                                {
                                  backgroundColor: isDeliveredStep ? '#DCFCE7' : '#FEF0EF',
                                  borderColor: isDeliveredStep ? '#BBF7D0' : '#FCE7E7',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.currentStepBadgeText,
                                  { color: isDeliveredStep ? '#15803D' : '#850404' },
                                ]}
                              >
                                Current status
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Timestamp: ONLY when recorded */}
                        {step.timestamp ? (
                          <Text style={styles.stepRecordedTime}>{step.timestamp}</Text>
                        ) : null}

                        {step.description ? (
                          <Text
                            style={[
                              styles.stepDescription,
                              (isCompleted || isCurrent) && styles.stepDescriptionActive,
                            ]}
                          >
                            {step.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Courier Partner & AWB Banner with Copy Button & Live Track CTA */}
            {displayAwb ? (
              <View style={styles.courierBannerBox}>
                <View style={styles.courierBannerTop}>
                  <View style={styles.courierBannerLeft}>
                    <View style={styles.courierIconSmall}>
                      <MaterialCommunityIcons name="truck-delivery-outline" size={18} color="#850404" />
                    </View>
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.courierPartnerName}>{summary.courierName}</Text>
                      <Text style={styles.courierAwbText}>AWB: {displayAwb}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.miniCopyBtn, copied && styles.miniCopyBtnActive]}
                    onPress={() => handleCopyAwb(displayAwb)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={copied ? '#15803D' : '#850404'}
                    />
                    <Text style={[styles.miniCopyText, copied && styles.miniCopyTextActive]}>
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Track Full Shipment Action */}
                <TouchableOpacity
                  style={styles.trackFullShipmentBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/track-order',
                      params: {
                        awbNo: displayAwb,
                        orderNumber: displayOrderNum,
                        productName: primaryProductName,
                        imageUrl: primaryProductImage,
                        price: String(finalTotal),
                        qty: String(primaryItem?.quantity || 1),
                        createdAt: order.createdAt,
                      },
                    })
                  }
                >
                  <Text style={styles.trackFullShipmentText}>View Full Shipment History</Text>
                  <Ionicons name="arrow-forward" size={16} color="#850404" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Refund Status Banner */}
        {Number(order.totalRefunded || 0) > 0 && (
          <View
            style={{
              backgroundColor: '#F0FDF4',
              borderWidth: 1,
              borderColor: '#BBF7D0',
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#DCFCE7',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="shield-checkmark" size={24} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#166534' }}>
                ₹{Number(order.totalRefunded).toLocaleString('en-IN')} Refund Initiated
              </Text>
              <Text style={{ fontSize: 12, color: '#15803D', marginTop: 2, lineHeight: 17 }}>
                Refund has been sent to your original online payment method (UPI / Bank / Card). You will receive an SMS and email notification.
              </Text>
            </View>
          </View>
        )}

        {/* Items in Order Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIconBox}>
              <Ionicons name="bag-handle-outline" size={18} color="#850404" />
            </View>
            <Text style={styles.cardTitle}>Items in Order ({items.length})</Text>
          </View>

          <View style={styles.itemsList}>
            {items.map((item, index) => {
              const image = getProductImage(item.product);
              const name = item.product?.productName || 'Traditional Handcrafted Saree';
              const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
              const isItemRefunded = item.refundStatus === 'refunded';

              return (
                <View
                  key={item.id || index}
                  style={[styles.itemRow, index < items.length - 1 && styles.itemRowBorder]}
                >
                  <Image source={{ uri: image }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text
                        style={[
                          styles.itemName,
                          isItemRefunded && { textDecorationLine: 'line-through', color: '#9CA3AF' },
                        ]}
                        numberOfLines={2}
                      >
                        {name}
                      </Text>
                      {isItemRefunded && (
                        <View
                          style={{
                            backgroundColor: '#FEF2F2',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: '#FCA5A5',
                            marginLeft: 6,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>REFUNDED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                      <Text style={styles.itemDot}>•</Text>
                      <Text style={styles.itemUnitPrice}>₹{item.price} each</Text>
                    </View>
                    <Text
                      style={[
                        styles.itemLineTotal,
                        isItemRefunded && { textDecorationLine: 'line-through', color: '#9CA3AF' },
                      ]}
                    >
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </Text>
                    {isItemRefunded && (
                      <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600', marginTop: 3 }}>
                        ₹{Number(item.refundAmount || itemTotal).toLocaleString('en-IN')} refunded to source
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Shipping Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIconBox}>
              <Ionicons name="location-outline" size={18} color="#850404" />
            </View>
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>

          {address ? (
            <View style={styles.addressBox}>
              {address.name ? <Text style={styles.recipientName}>{address.name}</Text> : null}
              {address.phoneNumber ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={14} color="#78716C" />
                  <Text style={styles.recipientPhone}>{address.phoneNumber}</Text>
                </View>
              ) : null}
              <Text style={styles.addressLine}>
                {[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyAddressText}>Standard customer shipping address</Text>
          )}
        </View>

        {/* Payment & Billing Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIconBox}>
              <Ionicons name="card-outline" size={18} color="#850404" />
            </View>
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentLabel}>Method</Text>
            <View style={styles.paymentMethodBadge}>
              <Text style={styles.paymentMethodText}>
                {order.paymentMethod === 'COD' ? 'Cash On Delivery (COD)' : 'Prepaid / Online Payment'}
              </Text>
            </View>
          </View>

          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentLabel}>Status</Text>
            <Text
              style={[
                styles.paymentStatusText,
                { color: order.paymentStatus === 'PAID' ? '#15803D' : '#850404' },
              ]}
            >
              {order.paymentStatus || (order.paymentMethod === 'COD' ? 'Pay upon Delivery' : 'Completed')}
            </Text>
          </View>

          <View style={styles.billDivider} />

          {/* Price Breakdown */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Shipping & Delivery</Text>
            <Text style={[styles.billValue, shippingFee === 0 && styles.freeShippingText]}>
              {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString('en-IN')}`}
            </Text>
          </View>

          {Number(order.totalRefunded || 0) > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#DC2626', fontWeight: '600' }]}>Refund Initiated</Text>
              <Text style={[styles.billValue, { color: '#DC2626', fontWeight: '700' }]}>
                -₹{Number(order.totalRefunded).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View style={styles.billDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Need Help Card */}
        <TouchableOpacity
          style={styles.helpCard}
          activeOpacity={0.8}
          onPress={() => router.push('/support')}
        >
          <View style={styles.helpLeft}>
            <View style={styles.helpIconBox}>
              <Ionicons name="headset-outline" size={22} color="#850404" />
            </View>
            <View>
              <Text style={styles.helpTitle}>Need help with this order?</Text>
              <Text style={styles.helpSub}>Chat with Prabha Tex support team</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#850404" />
        </TouchableOpacity>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6F0',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#78716C',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 16,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#850404',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE1',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8F6F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  /* HERO CARD */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF0EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCE7E7',
    gap: 4,
  },
  orderNumberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#850404',
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#FEF0EF',
    borderWidth: 1,
    borderColor: '#FCE7E7',
  },
  statusBadgeDelivered: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#850404',
  },
  statusBadgeTextDelivered: {
    color: '#15803D',
  },
  statusBadgeTextWarning: {
    color: '#B45309',
  },
  heroTitleContainer: {
    marginBottom: 12,
  },
  heroProductName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  heroDateText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  multiItemBadge: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  multiItemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#57534E',
  },

  /* PRODUCT IMAGE */
  heroImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 14,
  },
  heroProductImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 25, 23, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  imageOverlayPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imageOverlayDot: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  imageOverlayQty: {
    fontSize: 11,
    fontWeight: '500',
    color: '#E7E5E4',
  },

  /* TRACKING CONTAINER BELOW IMAGE */
  trackingContainer: {
    backgroundColor: '#FAF9F6',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    gap: 12,
  },

  /* STATUS SUMMARY CARD */
  statusSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE0DF',
    borderLeftWidth: 4,
    borderLeftColor: '#850404',
  },
  statusSummaryCardDelivered: {
    borderColor: '#BBF7D0',
    borderLeftColor: '#15803D',
  },
  statusSummaryCardWarning: {
    borderColor: '#FDE68A',
    borderLeftColor: '#B45309',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  summaryIconBoxDelivered: {
    backgroundColor: '#DCFCE7',
  },
  summaryIconBoxWarning: {
    backgroundColor: '#FEF3C7',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  summarySubheadline: {
    fontSize: 12,
    color: '#57534E',
    marginTop: 2,
    lineHeight: 16,
  },
  summaryMetaDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginVertical: 8,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryMetaText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
  },
  expectedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    gap: 6,
  },
  expectedDateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1917',
  },
  expectedDateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#850404',
  },

  /* 5-STEP TIMELINE */
  timelineWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  timelineHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#57534E',
    letterSpacing: 0.6,
  },
  timelineHeaderPartner: {
    fontSize: 11,
    fontWeight: '600',
    color: '#850404',
  },
  verticalTimeline: {
    paddingLeft: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 26,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E7E5E4',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineNodePending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E5E4',
  },
  timelineNodePendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D6D3D1',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: '#E7E5E4',
    marginVertical: 1,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 10,
    paddingTop: 1,
  },
  timelineContentSpacing: {
    paddingBottom: 14,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A8A29E',
  },
  stepTitleActive: {
    color: '#1C1917',
    fontWeight: '700',
  },
  currentStepBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  currentStepBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stepRecordedTime: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
    fontWeight: '500',
  },
  stepDescription: {
    fontSize: 12,
    color: '#A8A29E',
    marginTop: 2,
    lineHeight: 16,
  },
  stepDescriptionActive: {
    color: '#57534E',
  },

  /* COURIER & AWB BANNER */
  courierBannerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE0DF',
  },
  courierBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courierBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courierIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courierPartnerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
  },
  courierAwbText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
    marginTop: 1,
  },
  miniCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF0EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  miniCopyBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  miniCopyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#850404',
  },
  miniCopyTextActive: {
    color: '#15803D',
  },
  trackFullShipmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF0EF',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
  },
  trackFullShipmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#850404',
  },

  /* CARDS */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F5F5F4',
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
    lineHeight: 18,
    marginBottom: 4,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  itemDot: {
    fontSize: 12,
    color: '#A8A29E',
    marginHorizontal: 6,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#78716C',
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#850404',
  },
  addressBox: {
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recipientPhone: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
  },
  addressLine: {
    fontSize: 13,
    lineHeight: 18,
    color: '#44403C',
  },
  emptyAddressText: {
    fontSize: 13,
    color: '#A8A29E',
    fontStyle: 'italic',
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#78716C',
  },
  paymentMethodBadge: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1917',
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginVertical: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#78716C',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  freeShippingText: {
    color: '#15803D',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#850404',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  helpSub: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  footerSpacing: {
    height: 40,
  },
});
