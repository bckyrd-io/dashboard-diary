import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
<<<<<<< Updated upstream
import { Host } from '@expo/ui';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Theme } from './src/constants/Theme';
=======
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
>>>>>>> Stashed changes

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
<<<<<<< Updated upstream
        <ActivityIndicator size="large" color={Theme.primary} />
=======
        <ActivityIndicator size="large" color="#33b76d" />
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    <Host style={styles.host} seedColor={Theme.primary}>
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </Host>
=======
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
>>>>>>> Stashed changes
  );
}

const styles = StyleSheet.create({
<<<<<<< Updated upstream
  host: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
=======
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
>>>>>>> Stashed changes
    alignItems: 'center',
    justifyContent: 'center',
  },
});
