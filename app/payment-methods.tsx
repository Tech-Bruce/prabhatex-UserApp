import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Payment Methods', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Saved Cards</Text>
        
        <View style={styles.cardItem}>
          <View style={styles.cardLogo}>
            <Ionicons name="card" size={24} color="#850404" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>HDFC Bank Visa</Text>
            <Text style={styles.cardNumber}>**** **** **** 4589</Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>UPI IDs</Text>
        
        <View style={styles.cardItem}>
          <View style={styles.cardLogo}>
            <Ionicons name="phone-portrait-outline" size={24} color="#850404" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>Google Pay</Text>
            <Text style={styles.cardNumber}>prabhatex@okaxis</Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#850404" />
          <Text style={styles.addBtnText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    marginBottom: 12,
  },
  cardLogo: {
    width: 48,
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 13,
    color: '#888',
    letterSpacing: 1,
  },
  deleteBtn: {
    padding: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE1',
  },
  addBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#850404',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#850404',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
