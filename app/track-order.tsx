import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '@/src/utils/axiosInstance';
import {
  deriveMilestoneAndSteps,
  TrackingSummary,
  NormalizedTrackingEvent,
} from '@/src/utils/trackingStatus';

export default function TrackOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const awbNoParam = (params.awbNo as string) || '';
  const orderNumber = (params.orderNumber as string) || '';
  const productName = (params.productName as string) || '';
  const imageUrl = (params.imageUrl as string) || '';
  const price = (params.price as string) || '';
  const qty = (params.qty as string) || '1';

  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expandedRawEventIds, setExpandedRawEventIds] = useState<Record<string, boolean>>({});

  const fetchTracking = useCallback(async (isManualRefresh = false) => {
    if (!awbNoParam) {
      setError('No tracking number provided.');
      setLoading(false);
      return;
    }
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get(`/track/${awbNoParam}`);
      if (res.data?.success && res.data?.tracking) {
        setTracking(res.data.tracking);
        setError('');
      } else {
        setError('Could not fetch tracking details.');
      }
    } catch (err: any) {
      console.error('Failed to load tracking:', err);
      setError(
        err?.response?.data?.message || 'Failed to load tracking. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [awbNoParam]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const handleCopyAwb = async (awbText: string) => {
    try {
      await Clipboard.setStringAsync(awbText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy AWB:', e);
    }
  };

  const toggleRawEvent = (id: string) => {
    setExpandedRawEventIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Derive unified tracking summary
  const summary: TrackingSummary = deriveMilestoneAndSteps(
    {
      orderNumber,
      awbNo: awbNoParam,
      status: tracking?.status,
      shippingStatus: tracking?.shippingStatus,
      createdAt: params.createdAt as string,
    },
    tracking
  );

  const displayAwb = summary.awbNo || awbNoParam || 'N/A';
  const displayedEvents = showAllHistory ? summary.events : summary.events.slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Track Order',
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F8F6F0' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => fetchTracking(true)}
              style={styles.headerRefreshBtn}
              accessibilityLabel="Refresh tracking status"
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#850404" />
              ) : (
                <Ionicons name="refresh-outline" size={22} color="#1C1917" />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order & Product Summary Card */}
        <View style={styles.card}>
          <View style={styles.orderCardHeader}>
            <Text style={styles.orderIdText}>Order #{orderNumber || 'Details'}</Text>
            <View
              style={[
                styles.statusPill,
                summary.isDelivered && styles.statusPillDelivered,
                summary.isUnsuccessfulAttempt && styles.statusPillWarning,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  summary.isDelivered && styles.statusPillTextDelivered,
                  summary.isUnsuccessfulAttempt && styles.statusPillTextWarning,
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

          <View style={styles.itemRow}>
            <Image
              source={{
                uri:
                  imageUrl ||
                  'https://images.unsplash.com/photo-1610189013658-48b94f6c4df1?auto=format&fit=crop&w=300&q=80',
              }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {productName || 'Traditional Handcrafted Saree'}
              </Text>
              {price ? (
                <Text style={styles.itemPrice}>
                  ₹{Number(price).toLocaleString('en-IN')}{' '}
                  <Text style={styles.qty}>• Qty: {qty}</Text>
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Courier Info Card with Working Copy Button */}
        <View style={styles.card}>
          <View style={styles.courierRow}>
            <View style={styles.courierIconWrap}>
              <MaterialCommunityIcons name="truck-fast-outline" size={24} color="#850404" />
            </View>
            <View style={styles.courierTextCol}>
              <Text style={styles.courierLabel}>Courier Partner</Text>
              <Text style={styles.courierName}>{summary.courierName}</Text>
              <View style={styles.awbRow}>
                <Text style={styles.awbLabel}>AWB: </Text>
                <Text style={styles.awbValue}>{displayAwb}</Text>
              </View>
            </View>

            {/* Copy Button with Feedback */}
            {displayAwb !== 'N/A' && (
              <TouchableOpacity
                style={[styles.copyButton, copied && styles.copyButtonActive]}
                onPress={() => handleCopyAwb(displayAwb)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color={copied ? '#15803D' : '#850404'}
                />
                <Text style={[styles.copyButtonText, copied && styles.copyButtonTextActive]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Loading Spinner */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#850404" />
            <Text style={styles.loadingMessage}>Fetching courier shipment status...</Text>
          </View>
        ) : error && !tracking ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
            <Text style={styles.errorTitle}>Tracking Unavailable</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchTracking(true)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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

              {/* Latest Location & Last Updated */}
              <View style={styles.summaryMetaDivider} />
              <View style={styles.summaryMetaRow}>
                {summary.latestLocation ? (
                  <View style={styles.summaryMetaItem}>
                    <Ionicons name="location-outline" size={14} color="#78716C" />
                    <Text style={styles.summaryMetaText}>{summary.latestLocation}</Text>
                  </View>
                ) : null}
                {summary.lastUpdatedFormatted ? (
                  <View style={styles.summaryMetaItem}>
                    <Ionicons name="time-outline" size={14} color="#78716C" />
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

            {/* UNIFIED 5-STEP PROGRESS TIMELINE */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Delivery Progress</Text>
                <Text style={styles.sectionSub}>Standard Express Delivery</Text>
              </View>

              <View style={styles.timeline}>
                {summary.steps.map((step, index) => {
                  const isLast = index === summary.steps.length - 1;
                  const isDeliveredStep = step.step === 4 && summary.isDelivered;
                  const stepColor = isDeliveredStep ? '#15803D' : '#850404';

                  return (
                    <View key={step.title} style={styles.stepContainer}>
                      {/* Left: Indicator & Connecting Line */}
                      <View style={styles.stepIndicatorCol}>
                        <View
                          style={[
                            styles.stepNode,
                            step.completed && {
                              backgroundColor: stepColor,
                              borderColor: stepColor,
                            },
                            step.current && {
                              backgroundColor: stepColor,
                              borderColor: isDeliveredStep ? '#BBF7D0' : '#FCE7E7',
                              borderWidth: 3,
                              transform: [{ scale: 1.05 }],
                            },
                            !step.completed && !step.current && styles.stepNodePending,
                          ]}
                        >
                          {step.completed ? (
                            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          ) : step.current ? (
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
                            <View style={styles.stepNodePendingDot} />
                          )}
                        </View>
                        {!isLast && (
                          <View
                            style={[
                              styles.stepConnectorLine,
                              step.completed && { backgroundColor: stepColor },
                            ]}
                          />
                        )}
                      </View>

                      {/* Right: Step Content */}
                      <View style={[styles.stepContentCol, !isLast && styles.stepContentSpacing]}>
                        <View style={styles.stepHeaderRow}>
                          <Text
                            style={[
                              styles.stepTitleText,
                              (step.completed || step.current) && styles.stepTitleTextActive,
                              step.current && { color: stepColor, fontWeight: '700' },
                            ]}
                          >
                            {step.title}
                          </Text>
                          {step.current && (
                            <View
                              style={[
                                styles.currentPill,
                                {
                                  backgroundColor: isDeliveredStep ? '#DCFCE7' : '#FEF0EF',
                                  borderColor: isDeliveredStep ? '#BBF7D0' : '#FCE7E7',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.currentPillText,
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
                          <Text style={styles.stepTimestamp}>{step.timestamp}</Text>
                        ) : null}

                        {step.description ? (
                          <Text
                            style={[
                              styles.stepDescriptionText,
                              (step.completed || step.current) && styles.stepDescriptionTextActive,
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

            {/* SHIPMENT HISTORY */}
            {summary.events.length > 0 && (
              <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Shipment History</Text>
                  <Text style={styles.eventCountBadge}>
                    {summary.events.length} {summary.events.length === 1 ? 'event' : 'events'}
                  </Text>
                </View>

                <View style={styles.historyList}>
                  {displayedEvents.map((ev, idx) => {
                    const isLatest = idx === 0;
                    const eventKey = ev.eventId || String(idx);
                    const isRawExpanded = !!expandedRawEventIds[eventKey];

                    return (
                      <View
                        key={eventKey}
                        style={[
                          styles.historyItemCard,
                          isLatest && styles.historyItemCardLatest,
                        ]}
                      >
                        <View style={styles.historyItemHeader}>
                          <View style={styles.historyItemTitleLeft}>
                            {isLatest && <View style={styles.latestDot} />}
                            <Text
                              style={[
                                styles.historyPlainTitle,
                                isLatest && styles.historyPlainTitleLatest,
                              ]}
                            >
                              {ev.plainDescription}
                            </Text>
                          </View>
                          {isLatest && (
                            <View style={styles.latestUpdatePill}>
                              <Text style={styles.latestUpdatePillText}>Latest</Text>
                            </View>
                          )}
                        </View>

                        {/* Location & Time */}
                        <View style={styles.historyMetaRow}>
                          {ev.location ? (
                            <View style={styles.historyMetaChip}>
                              <Ionicons name="location-outline" size={13} color="#78716C" />
                              <Text style={styles.historyMetaChipText}>{ev.location}</Text>
                            </View>
                          ) : null}
                          {ev.formattedDate ? (
                            <View style={styles.historyMetaChip}>
                              <Ionicons name="time-outline" size={13} color="#78716C" />
                              <Text style={styles.historyMetaChipText}>{ev.formattedDate}</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Expandable Original Courier Wording */}
                        <TouchableOpacity
                          style={styles.rawCourierToggle}
                          onPress={() => toggleRawEvent(eventKey)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.rawCourierToggleText}>
                            {isRawExpanded ? 'Hide courier note' : 'View courier note'}
                          </Text>
                          <Ionicons
                            name={isRawExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color="#850404"
                          />
                        </TouchableOpacity>

                        {isRawExpanded && (
                          <View style={styles.rawCourierBox}>
                            <Text style={styles.rawCourierLabel}>Original Courier Status:</Text>
                            <Text style={styles.rawCourierText}>
                              {ev.rawStatus || ev.statusText || 'No additional details provided'}
                            </Text>
                            {ev.statusCode ? (
                              <Text style={styles.rawCourierCode}>
                                Status Code: {ev.statusCode}
                              </Text>
                            ) : null}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Show More / Show Less Accordion */}
                {summary.events.length > 2 && (
                  <TouchableOpacity
                    style={styles.toggleAllUpdatesBtn}
                    onPress={() => setShowAllHistory(!showAllHistory)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.toggleAllUpdatesText}>
                      {showAllHistory
                        ? 'Show fewer updates'
                        : `View all ${summary.events.length} updates`}
                    </Text>
                    <Ionicons
                      name={showAllHistory ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#850404"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

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
  headerRefreshBtn: {
    padding: 8,
    marginRight: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  statusPill: {
    backgroundColor: '#FEF0EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCE7E7',
  },
  statusPillDelivered: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusPillWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#850404',
  },
  statusPillTextDelivered: {
    color: '#15803D',
  },
  statusPillTextWarning: {
    color: '#B45309',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
    marginRight: 12,
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
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#850404',
  },
  qty: {
    color: '#78716C',
    fontWeight: '500',
    fontSize: 12,
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courierIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courierTextCol: {
    flex: 1,
  },
  courierLabel: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
  },
  courierName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 1,
  },
  awbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  awbLabel: {
    fontSize: 12,
    color: '#78716C',
  },
  awbValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1917',
    letterSpacing: 0.3,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF0EF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCE7E7',
  },
  copyButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#850404',
  },
  copyButtonTextActive: {
    color: '#15803D',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  loadingMessage: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 12,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 8,
    marginBottom: 4,
  },
  errorSub: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#850404',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },

  /* PROMINENT STATUS SUMMARY CARD */
  statusSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  summarySubheadline: {
    fontSize: 13,
    color: '#57534E',
    marginTop: 2,
    lineHeight: 18,
  },
  summaryMetaDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginVertical: 10,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryMetaText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  expectedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    gap: 6,
  },
  expectedDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1917',
  },
  expectedDateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#850404',
  },

  /* SECTION HEADERS */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  sectionSub: {
    fontSize: 11,
    color: '#78716C',
  },
  eventCountBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716C',
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  /* PROGRESS TIMELINE */
  timeline: {
    paddingLeft: 4,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E7E5E4',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepNodePending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E5E4',
  },
  stepNodePendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6D3D1',
  },
  stepConnectorLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: '#E7E5E4',
    marginVertical: 1,
    zIndex: 1,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: 10,
    paddingTop: 1,
  },
  stepContentSpacing: {
    paddingBottom: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A8A29E',
  },
  stepTitleTextActive: {
    color: '#1C1917',
    fontWeight: '700',
  },
  currentPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  currentPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stepTimestamp: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
    fontWeight: '500',
  },
  stepDescriptionText: {
    fontSize: 12,
    color: '#A8A29E',
    marginTop: 2,
    lineHeight: 16,
  },
  stepDescriptionTextActive: {
    color: '#57534E',
  },

  /* SHIPMENT HISTORY */
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  historyItemCardLatest: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FDE0DF',
    borderLeftWidth: 3,
    borderLeftColor: '#850404',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  historyItemTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  latestDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#850404',
  },
  historyPlainTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
    flex: 1,
  },
  historyPlainTitleLatest: {
    color: '#1C1917',
    fontWeight: '700',
  },
  latestUpdatePill: {
    backgroundColor: '#FEF0EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  latestUpdatePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#850404',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  historyMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMetaChipText: {
    fontSize: 11,
    color: '#78716C',
  },
  rawCourierToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  rawCourierToggleText: {
    fontSize: 11,
    color: '#850404',
    fontWeight: '600',
  },
  rawCourierBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#F5F5F4',
    borderRadius: 6,
  },
  rawCourierLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716C',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  rawCourierText: {
    fontSize: 11,
    color: '#1C1917',
    lineHeight: 15,
  },
  rawCourierCode: {
    fontSize: 10,
    color: '#78716C',
    marginTop: 2,
    fontWeight: '500',
  },
  toggleAllUpdatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
  toggleAllUpdatesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#850404',
  },
  footerSpacing: {
    height: 30,
  },
});
