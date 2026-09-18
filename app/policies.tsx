import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PoliciesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Policies', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.heading}>Return & Exchange Policy</Text>
          <Text style={styles.paragraph}>
            We want you to be completely satisfied with your purchase. If you are not entirely happy, you can return or exchange the item within 7 days of delivery.
          </Text>
          <Text style={styles.bullet}>• Items must be unused and in original condition.</Text>
          <Text style={styles.bullet}>• Original tags and packaging must be intact.</Text>
          <Text style={styles.bullet}>• Custom-tailored items cannot be returned.</Text>

          <View style={styles.divider} />

          <Text style={styles.heading}>Privacy Policy</Text>
          <Text style={styles.paragraph}>
            Prabha Tex respects your privacy. We collect your information only to provide and improve our services. Your personal data is never sold to third parties. We use industry-standard encryption to protect your payment details.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.heading}>Terms of Service</Text>
          <Text style={styles.paragraph}>
            By using our application, you agree to our terms. Prices are subject to change without notice. We reserve the right to refuse service to anyone for any reason at any time.
          </Text>
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#850404',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EBE1',
    marginVertical: 24,
  },
});
