import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../constants/Theme';

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.centered}>
          {/* Logo / Brand */}
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>👟</Text>
            </View>
            <Text style={styles.appName}>The Sneaker Lounge</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={Theme.mutedForeground}
              autoCapitalize="none"
              style={styles.input}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Theme.mutedForeground}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeEmoji}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            The Sneaker Lounge - Home of Shoes and Other Accessories
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 80, height: 80, backgroundColor: Theme.primary,
    borderRadius: Theme.radius, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoEmoji: { fontSize: 36, color: '#fff' },
  appName: { fontSize: 28, fontWeight: 'bold', color: Theme.foreground },
  subtitle: { color: Theme.mutedForeground, marginTop: 4, fontSize: 15 },
  card: {
    backgroundColor: Theme.background, borderRadius: Theme.radius,
    borderWidth: 1, borderColor: Theme.border, padding: 24,
    ...Theme.shadowSm,
  },
  label: { fontSize: 13, fontWeight: '600', color: Theme.gray700, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Theme.border, borderRadius: Theme.radius,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Theme.muted,
    color: Theme.foreground, fontSize: 15, marginBottom: 16,
  },
  passwordRow: {
    borderWidth: 1, borderColor: Theme.border, borderRadius: Theme.radius,
    backgroundColor: Theme.muted, flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14,
    color: Theme.foreground, fontSize: 15,
  },
  eyeBtn: { paddingHorizontal: 12 },
  eyeEmoji: { fontSize: 18, color: Theme.mutedForeground },
  errorText: { color: Theme.destructive, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  submitBtn: {
    backgroundColor: Theme.primary, paddingVertical: 16,
    borderRadius: Theme.radius, alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  footer: { textAlign: 'center', color: Theme.mutedForeground, fontSize: 12, marginTop: 24 },
});
