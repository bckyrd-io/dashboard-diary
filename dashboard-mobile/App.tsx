import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Host } from '@expo/ui';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { TransferProvider } from './src/context/TransferContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Theme } from './src/constants/Theme';
import { initNotifications } from './src/services/notifications';

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
  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <Host style={{ flex: 1 }} seedColor={Theme.primary}>
      <AuthProvider>
        <CartProvider>
          <TransferProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </TransferProvider>
        </CartProvider>
      </AuthProvider>
    </Host>
  );
}

