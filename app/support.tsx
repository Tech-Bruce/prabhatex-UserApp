import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const FAQS = [
  { question: 'How can I track my order?', answer: 'You can track your order by navigating to the Orders section and tapping "Track Order" on any active purchase.' },
  { question: 'What is the return policy?', answer: 'We offer a 7-day no-questions-asked return policy for all unworn items with tags attached.' },
  { question: 'Do you ship internationally?', answer: 'Currently, we only ship within India. We plan to expand internationally soon.' },
];

export default function SupportScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Help & Support', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubbles-outline" size={24} color="#850404" />
              </View>
              <Text style={styles.contactText}>Chat Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={24} color="#850404" />
              </View>
              <Text style={styles.contactText}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={24} color="#850404" />
              </View>
              <Text style={styles.contactText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {FAQS.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity style={styles.faqHeader} onPress={() => toggleExpand(index)}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons name={expandedIndex === index ? "chevron-up" : "chevron-down"} size={20} color="#666" />
              </TouchableOpacity>
              {expandedIndex === index && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

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
  },
  contactSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EBE1',
    marginHorizontal: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  faqContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    paddingRight: 16,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
