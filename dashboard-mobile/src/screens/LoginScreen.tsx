import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
<<<<<<< Updated upstream
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../constants/Theme';
=======
} from 'react-native';
import { useAuth } from '../context/AuthContext';
>>>>>>> Stashed changes

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< Updated upstream
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🌾</Text>
            </View>
            <Text style={styles.title}>Farm Diary</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Username</Text>
=======
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo / Brand */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-primary rounded-3xl items-center justify-center mb-4">
              <Text className="text-white text-4xl font-bold">🌾</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Farm Diary</Text>
            <Text className="text-gray-400 mt-1 text-base">Sign in to your account</Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
            {/* Username */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Username</Text>
>>>>>>> Stashed changes
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
<<<<<<< Updated upstream
              placeholderTextColor={Theme.gray400}
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
=======
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 mb-4 text-base"
            />

            {/* Password */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Password</Text>
            <View className="border border-gray-200 rounded-xl bg-gray-50 flex-row items-center mb-4">
>>>>>>> Stashed changes
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
<<<<<<< Updated upstream
                placeholderTextColor={Theme.gray400}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.submitButton}
=======
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                className="flex-1 px-4 py-3 text-gray-900 text-base"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
                <Text className="text-gray-400 text-lg">{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {!!error && (
              <Text className="text-red-500 text-sm mb-3 text-center">{error}</Text>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-primary py-4 rounded-xl items-center"
>>>>>>> Stashed changes
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
<<<<<<< Updated upstream
                <Text style={styles.submitText}>Sign In</Text>
=======
                <Text className="text-white font-bold text-base">Sign In</Text>
>>>>>>> Stashed changes
              )}
            </TouchableOpacity>
          </View>

<<<<<<< Updated upstream
          <Text style={styles.footer}>
=======
          <Text className="text-center text-gray-400 text-xs mt-6">
>>>>>>> Stashed changes
            Farm Diary Management System
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
<<<<<<< Updated upstream

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: Theme.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Theme.gray900,
  },
  subtitle: {
    color: Theme.gray400,
    marginTop: 4,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.gray700,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.gray300,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    color: Theme.gray900,
    marginBottom: 16,
    fontSize: 16,
  },
  passwordRow: {
    borderWidth: 1,
    borderColor: Theme.gray300,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.gray900,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  eyeIcon: {
    color: Theme.gray400,
    fontSize: 18,
  },
  errorText: {
    color: Theme.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: Theme.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    color: Theme.gray400,
    fontSize: 12,
    marginTop: 24,
  },
});
=======
>>>>>>> Stashed changes
