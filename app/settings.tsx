import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

  const renderToggle = (icon: any, title: string, subtitle: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#850404" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ false: '#D1D1D6', true: '#850404' }}
        thumbColor="#FFF"
      />
    </View>
  );

  const renderAction = (icon: any, title: string, danger = false) => (
    <TouchableOpacity style={styles.actionRow}>
      <View style={[styles.settingIcon, danger && { backgroundColor: '#FFEBEE' }]}>
        <Ionicons name={icon} size={22} color={danger ? "#C62828" : "#850404"} />
      </View>
      <Text style={[styles.actionTitle, danger && { color: '#C62828' }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Settings', headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#F8F6F0' } }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          {renderToggle('notifications-outline', 'Push Notifications', 'Order updates & offers', pushEnabled, setPushEnabled)}
          <View style={styles.divider} />
          {renderToggle('mail-outline', 'Email Notifications', 'Newsletters & promos', emailEnabled, setEmailEnabled)}
          <View style={styles.divider} />
          {renderToggle('moon-outline', 'Dark Mode', 'Dark theme (coming soon)', darkTheme, setDarkTheme)}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {renderAction('lock-closed-outline', 'Change Password')}
          <View style={styles.divider} />
          {renderAction('language-outline', 'App Language')}
        </View>

        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          {renderAction('trash-outline', 'Delete Account', true)}
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F6F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  actionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 72,
  },
});
