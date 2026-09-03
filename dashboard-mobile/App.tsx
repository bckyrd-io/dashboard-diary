import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Host } from '@expo/ui';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Theme } from './src/constants/Theme';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <Host style={{ flex: 1 }} seedColor={Theme.primary}>
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </Host>
  );
}
