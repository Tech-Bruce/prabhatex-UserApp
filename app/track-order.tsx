import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/axiosInstance';

export default function TrackOrderScreen() {
  const params = useLocalSearchParams();
  const awbNo = params.awbNo as string;
  const orderNumber = params.orderNumber as string;
  const productName = params.productName as string;
  const imageUrl = params.imageUrl as string;
  const price = params.price as string;
  const qty = params.qty as string;

  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    const fetchTracking = async () => {
      if (!awbNo) {
        if (isActive) {
          setError('No tracking number provided.');
          setLoading(false);
        }
        return;
      }
      try {
        const res = await api.get(`/track/${awbNo}`);
        if (isActive) {
          if (res.data.success) {
            setTracking(res.data.tracking);
          } else {
            setError('Could not fetch tracking details.');
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isActive) {
          setError(err.response?.data?.message || 'Failed to load tracking. Please try again.');
          setLoading(false);
        }
      }
    };
    fetchTracking();
    return () => { isActive = false; };
  }, [awbNo]);

  // Clean location logic
  const cleanLocation = (loc: string) => loc ? loc.replace(/^[A-Z0-9]+-/, '').replace(/hub/i, 'Hub').trim() : '';

  let rawEvents = tracking?.result || tracking?.events || tracking?.tracking_details || [];
  
  // Sort descending by date
  let events = [...rawEvents].sort((a: any, b: any) => {
    const d1 = new Date(b.date || b.DateTime || b.time || b.timestamp || 0).getTime();
    const d2 = new Date(a.date || a.DateTime || a.time || a.timestamp || 0).getTime();
    return d1 - d2;
  });

  // Filter exact duplicates
  events = events.filter((ev: any, i: number, arr: any[]) => {
    if (i === 0) return true;
    const prev = arr[i - 1];
    const evStatus = (ev.status || ev.Status || ev.Activity || ev.activity || '').toLowerCase();
    const prevStatus = (prev.status || prev.Status || prev.Activity || prev.activity || '').toLowerCase();
    const evLoc = (ev.location || ev.Location || ev.city || ev.City || '').toLowerCase();
    const prevLoc = (prev.location || prev.Location || prev.city || prev.City || '').toLowerCase();
    const evDate = (ev.date || ev.DateTime || ev.time || ev.timestamp || '');
    const prevDate = (prev.date || prev.DateTime || prev.time || prev.timestamp || '');
    return !(evStatus === prevStatus && evLoc === prevLoc && evDate === prevDate);
  });

  const latestEventStatus = events.length > 0 ? (events[0].status || events[0].Status || events[0].Activity || events[0].activity) : null;
  const currentStatus = (latestEventStatus || tracking?.status || '').toLowerCase();

  const getStatusStep = (s: string) => {
    if (s === 'delivered') return 4;
    if (s === 'out for delivery' || s === 'drs') return 3;
    if (s === 'shipped' || s === 'in transit') return 2;
    if (s === 'processing' || s === 'booked' || s === 'picked') return 1;
    return 0;
  };

  const currentStepIndex = getStatusStep(currentStatus);

  const stepsBase = [
    { title: 'Order Placed', step: 0 },
    { title: 'Processing', step: 1 },
    { title: 'Shipped', step: 2 },
    { title: 'Out for Delivery', step: 3 },
    { title: 'Delivered', step: 4 },
  ];

  const steps = stepsBase.map(s => ({
    ...s,
    completed: currentStepIndex >= s.step,
    current: currentStepIndex === s.step
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Track Order', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Summary Card */}
        <View style={styles.card}>
          <Text style={styles.orderId}>Order #{orderNumber || 'Unknown'}</Text>
          <View style={styles.itemRow}>
            <Image source={{ uri: imageUrl || 'https://images.unsplash.com/photo-1610189013658-48b94f6c4df1?auto=format&fit=crop&w=300&q=80' }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{productName || 'Product'}</Text>
              <Text style={styles.itemPrice}>₹{price || '0'} <Text style={styles.qty}>x {qty || 1}</Text></Text>
            </View>
          </View>
        </View>

        {/* Courier Info */}
        <View style={styles.card}>
          <View style={styles.courierHeader}>
            <Ionicons name="cube-outline" size={24} color="#850404" />
            <View style={styles.courierText}>
              <Text style={styles.courierName}>{tracking?.courierName || 'Courier'}</Text>
              <Text style={styles.trackingId}>Tracking number: {awbNo || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#850404" style={{ marginTop: 20 }} />
        ) : error ? (
          <View style={styles.card}>
            <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Timeline Steps (High Level) */}
            <View style={styles.card}>
              <Text style={styles.timelineTitle}>Delivery Status</Text>
              <View style={styles.timeline}>
                {steps.map((step, index) => (
                  <View key={step.title} style={styles.stepContainer}>
                    <View style={styles.stepIndicator}>
                      <View style={[styles.dot, step.completed ? styles.dotCompleted : styles.dotPending]}>
                        {step.completed && <Ionicons name="checkmark" size={12} color="#FFF" />}
                      </View>
                      {index < steps.length - 1 && (
                        <View style={[styles.line, step.completed && !step.current ? styles.lineCompleted : styles.linePending]} />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted, step.current && styles.stepTitleCurrent]}>
                        {step.title}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Detailed Shipment History Log */}
            {events.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.timelineTitle}>Shipment History</Text>
                <View style={styles.timeline}>
                  {events.map((ev: any, index: number) => {
                    const evDate = ev.date || ev.DateTime || ev.time || ev.timestamp || '';
                    const rawStatus = ev.status || ev.Status || ev.Activity || ev.activity || '';
                    const evLocation = cleanLocation(ev.location || ev.Location || ev.city || ev.City || '');
                    return (
                      <View key={index} style={styles.stepContainer}>
                        <View style={styles.stepIndicator}>
                          <View style={[styles.dot, index === 0 ? styles.dotCompleted : styles.dotPending, { width: 14, height: 14 }]} />
                          {index < events.length - 1 && <View style={[styles.line, { backgroundColor: '#E0E0E0' }]} />}
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={[styles.stepTitle, index === 0 ? styles.stepTitleCurrent : styles.stepTitleCompleted]}>
                            {rawStatus}
                          </Text>
                          {evLocation ? <Text style={styles.stepTime}>{evLocation}</Text> : null}
                          {evDate ? (
                            <Text style={styles.stepTime}>
                              {new Date(evDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemRow: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#850404',
  },
  qty: {
    color: '#888',
    fontWeight: 'normal',
    fontSize: 12,
  },
  courierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courierText: {
    marginLeft: 12,
  },
  courierName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 60,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotCompleted: {
    backgroundColor: '#850404',
  },
  dotPending: {
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: -2,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: '#850404',
  },
  linePending: {
    backgroundColor: '#E0E0E0',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
  },
  stepTitleCompleted: {
    color: '#333',
  },
  stepTitleCurrent: {
    color: '#850404',
  },
  stepTime: {
    fontSize: 12,
    color: '#888',
  }
});
