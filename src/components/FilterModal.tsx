import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FilterOptions {
  sortBy: string;
  sortOrder: string;
  minPrice: string;
  maxPrice: string;
}

interface FilterModalProps {
  visible: boolean;
  initialFilters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function FilterModal({ visible, initialFilters, onApply, onReset, onClose }: FilterModalProps) {
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);

  useEffect(() => {
    if (visible) {
      setSortBy(initialFilters.sortBy);
      setSortOrder(initialFilters.sortOrder);
      setMinPrice(initialFilters.minPrice);
      setMaxPrice(initialFilters.maxPrice);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply({ sortBy, sortOrder, minPrice, maxPrice });
  };

  const handleReset = () => {
    setSortBy('');
    setSortOrder('');
    setMinPrice('');
    setMaxPrice('');
    onReset();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort & Filter</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.sortOptions}>
            <TouchableOpacity 
              style={[styles.sortBtn, sortBy === 'productName' && sortOrder === 'ASC' && styles.sortBtnActive]}
              onPress={() => { setSortBy('productName'); setSortOrder('ASC'); }}
            >
              <Text style={[styles.sortBtnText, sortBy === 'productName' && sortOrder === 'ASC' && styles.sortBtnTextActive]}>A - Z</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortBtn, sortBy === 'productName' && sortOrder === 'DESC' && styles.sortBtnActive]}
              onPress={() => { setSortBy('productName'); setSortOrder('DESC'); }}
            >
              <Text style={[styles.sortBtnText, sortBy === 'productName' && sortOrder === 'DESC' && styles.sortBtnTextActive]}>Z - A</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortBtn, sortBy === 'finalPrice' && sortOrder === 'ASC' && styles.sortBtnActive]}
              onPress={() => { setSortBy('finalPrice'); setSortOrder('ASC'); }}
            >
              <Text style={[styles.sortBtnText, sortBy === 'finalPrice' && sortOrder === 'ASC' && styles.sortBtnTextActive]}>Price: Low-High</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortBtn, sortBy === 'finalPrice' && sortOrder === 'DESC' && styles.sortBtnActive]}
              onPress={() => { setSortBy('finalPrice'); setSortOrder('DESC'); }}
            >
              <Text style={[styles.sortBtnText, sortBy === 'finalPrice' && sortOrder === 'DESC' && styles.sortBtnTextActive]}>Price: High-Low</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Price Range</Text>
          <View style={styles.priceRowInputs}>
            <TextInput 
              style={styles.priceInput}
              placeholder="Min Price (₹)"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={styles.priceDash}>-</Text>
            <TextInput 
              style={styles.priceInput}
              placeholder="Max Price (₹)"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeBtn: { padding: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 12, marginTop: 10 },
  sortOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  sortBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  sortBtnActive: { backgroundColor: '#850404', borderColor: '#850404' },
  sortBtnText: { color: '#555', fontSize: 14 },
  sortBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  priceRowInputs: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  priceInput: { flex: 1, height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#f9f9f9' },
  priceDash: { marginHorizontal: 12, fontSize: 18, color: '#888' },
  modalActions: { flexDirection: 'row', gap: 12 },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  resetBtnText: { color: '#555', fontWeight: '600', fontSize: 16 },
  applyBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#850404', alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 }
});
