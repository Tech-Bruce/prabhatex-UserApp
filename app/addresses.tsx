import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/axiosInstance';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', street: '', city: '', state: '', zipCode: '' });
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchAddresses = async () => {
        try {
          const res = await api.get('/address');
          if (isActive) {
            setAddresses(res.data.data || []);
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to fetch addresses:", error);
          if (isActive) setLoading(false);
        }
      };
      fetchAddresses();
      return () => { isActive = false; };
    }, [])
  );

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/address');
      setAddresses(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ fullName: '', phoneNumber: '', street: '', city: '', state: '', zipCode: '' });
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setForm({
      fullName: item.fullName,
      phoneNumber: item.phoneNumber,
      street: item.street,
      city: item.city,
      state: item.state,
      zipCode: item.zipCode
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.phoneNumber || !form.street || !form.city || !form.state || !form.zipCode) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/address/${editingId}`, form);
      } else {
        await api.post('/address', form);
      }
      setModalVisible(false);
      await fetchAddresses();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/address/${id}`);
            await fetchAddresses();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete address');
          }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Stack.Screen options={{ title: 'Saved Addresses', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#850404" style={{ marginTop: 40 }} />
        ) : addresses.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="location-outline" size={60} color="#CCC" />
            <Text style={{ color: '#666', marginTop: 16 }}>No saved addresses found.</Text>
          </View>
        ) : (
          addresses.map((item) => (
            <View key={item.id} style={[styles.card, item.isDefault && styles.cardDefault]}>
              <View style={styles.headerRow}>
                <View style={styles.typeBadge}>
                  <Ionicons name="location" size={12} color="#850404" />
                  <Text style={styles.typeText}>Saved Address</Text>
                </View>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>

              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.addressLine}>{item.street}</Text>
              <Text style={styles.addressLine}>{item.city}, {item.state} - {item.zipCode}</Text>
              <Text style={styles.phone}>Phone: {item.phoneNumber}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.actionText}>Remove</Text>
                </TouchableOpacity>
              </View>
          </View>
        )))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) + 10 }]}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add New Address'}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe"
                placeholderTextColor="#9CA3AF"
                value={form.fullName}
                onChangeText={(t) => setForm(p => ({...p, fullName: t}))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210 (10 digits)"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.phoneNumber}
                onChangeText={(t) => setForm(p => ({...p, phoneNumber: t.replace(/\D/g, '').slice(0, 10)}))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="House / Flat No, Street, Landmark"
                placeholderTextColor="#9CA3AF"
                value={form.street}
                onChangeText={(t) => setForm(p => ({...p, street: t}))}
              />
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>City <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chennai"
                  placeholderTextColor="#9CA3AF"
                  value={form.city}
                  onChangeText={(t) => setForm(p => ({...p, city: t}))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Tamil Nadu"
                  placeholderTextColor="#9CA3AF"
                  value={form.state}
                  onChangeText={(t) => setForm(p => ({...p, state: t}))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN / Zip Code <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 600001"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={form.zipCode}
                onChangeText={(t) => setForm(p => ({...p, zipCode: t}))}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalSaveText}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  cardDefault: {
    borderColor: '#850404',
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  defaultBadge: {
    backgroundColor: '#850404',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  addressLine: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  phone: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#850404',
  },
  separator: {
    width: 1,
    backgroundColor: '#F5F5F5',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE1',
  },
  addBtn: {
    backgroundColor: '#850404',
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalSaveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#850404',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
