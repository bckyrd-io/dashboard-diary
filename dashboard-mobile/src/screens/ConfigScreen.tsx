// Server configuration screen — the manual counterpart of the old automatic
// server discovery. Reached from the "Server Config" link at the bottom of
// the Landing page (so it can be revisited any time), it asks how the app
// should reach its backend and verifies the choice against GET /api/health:
//
//   Online  -> the URL baked into this build (EXPO_PUBLIC_API_URL: Vercel on
//              the APK, dashboard-mobile/.env during development). Read-only.
//   Offline -> the address of the PC running the API, typed by hand.
//
// The choice is persisted in AsyncStorage as { mode, localAddress } and is
// applied by src/services/http.ts on every request. No subnet scanning.
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Cloud, HardDrive, RotateCcw } from 'lucide-react-native';
import { Button, Card, Input, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
import {
  clearServerConfig,
  getDefaultUrl,
  getEffectiveServerUrl,
  getServerConfig,
  isValidServerUrl,
  normalizeUrl,
  setServerConfig,
  testServerUrl,
  type ServerMode,
} from '../config/serverUrl';

type Status =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'ok'; text: string }
  | { kind: 'err'; text: string };

export default function ConfigScreen() {
  const navigation = useNavigation();

  const [mode, setMode] = useState<ServerMode>('online');
  const [localAddress, setLocalAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const runHealthCheck = useCallback(async (target: string | null) => {
    if (!target) {
      setStatus({ kind: 'err', text: 'No server address configured yet.' });
      return;
    }
    setStatus({ kind: 'testing' });
    const reachable = await testServerUrl(target);
    setStatus(
      reachable
        ? { kind: 'ok', text: `Connected to ${target}` }
        : {
            kind: 'err',
            text: `No server answered at ${target}. Make sure the API is running and the port is 3000.`,
          }
    );
  }, []);

  // Load the saved choice and re-test the current target every time the
  // screen opens (including when it's revisited from the Landing link).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const config = await getServerConfig();
        const effective = await getEffectiveServerUrl();
        if (cancelled) return;
        setMode(config.mode);
        setLocalAddress(config.localAddress ?? getDefaultUrl() ?? '');
        await runHealthCheck(effective);
      })();
      return () => {
        cancelled = true;
      };
    }, [runHealthCheck])
  );

  const handleSaveAndTest = async () => {
    let addressToSave: string | null = null;
    if (mode === 'local') {
      const candidate = normalizeUrl(localAddress);
      if (!isValidServerUrl(candidate)) {
        setStatus({
          kind: 'err',
          text: 'Enter a valid address like http://192.168.1.105:3000',
        });
        return;
      }
      addressToSave = candidate;
      setLocalAddress(candidate);
    }

    setSaving(true);
    try {
      await setServerConfig({ mode, localAddress: addressToSave });
      await runHealthCheck(
        mode === 'local' ? addressToSave : getDefaultUrl()
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setSaving(true);
    try {
      await clearServerConfig();
      setMode('online');
      setLocalAddress(getDefaultUrl() ?? '');
      await runHealthCheck(getDefaultUrl());
    } finally {
      setSaving(false);
    }
  };

  const defaultUrl = getDefaultUrl();
  const testing = status.kind === 'testing' || saving;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Server Config" back={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.shell, styles.shellNarrow]}>
          <Text style={styles.intro}>
            Choose how this device connects to the server. Your choice is saved
            on this device and can be changed any time from this screen.
          </Text>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Connection mode</Text>

            <TouchableOpacity
              style={[styles.modeOption, mode === 'online' && styles.modeOptionActive]}
              onPress={() => setMode('online')}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, mode === 'online' && styles.radioActive]}>
                {mode === 'online' ? <View style={styles.radioDot} /> : null}
              </View>
              <Cloud
                size={20}
                color={mode === 'online' ? Theme.primary : Theme.mutedForeground}
                style={styles.modeIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>Online</Text>
                <Text style={styles.modeDescription}>
                  Hosted server — the app talks to the online database, no
                  setup needed.
                </Text>
                <Text style={styles.modeAddress} numberOfLines={1}>
                  {defaultUrl ?? 'No build URL configured'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeOption, mode === 'local' && styles.modeOptionActive]}
              onPress={() => setMode('local')}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, mode === 'local' && styles.radioActive]}>
                {mode === 'local' ? <View style={styles.radioDot} /> : null}
              </View>
              <HardDrive
                size={20}
                color={mode === 'local' ? Theme.primary : Theme.mutedForeground}
                style={styles.modeIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>Offline (local PC)</Text>
                <Text style={styles.modeDescription}>
                  Your PC runs the API and stores the data locally.
                </Text>
              </View>
            </TouchableOpacity>

            {mode === 'local' ? (
              <View style={styles.localField}>
                <Text style={styles.inputLabel}>PC server address</Text>
                <Input
                  value={localAddress}
                  onChangeText={setLocalAddress}
                  placeholder="http://192.168.1.105:3000"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  selectTextOnFocus
                />
                <Text style={styles.inputHelp}>
                  Must be on the same network as this phone, with the API
                  running (port 3000).
                </Text>
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Connection status</Text>

            <View style={styles.statusRow}>
              {testing ? (
                <ActivityIndicator size="small" color={Theme.mutedForeground} />
              ) : (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: status.kind === 'ok' ? Theme.success : Theme.error },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.statusText,
                  status.kind === 'ok' && { color: Theme.success },
                  status.kind === 'err' && { color: Theme.error },
                ]}
              >
                {status.kind === 'idle'
                  ? 'Not tested yet'
                  : status.kind === 'testing'
                    ? 'Testing connection…'
                    : status.text}
              </Text>
            </View>

            <Button
              onPress={handleSaveAndTest}
              loading={saving}
              disabled={testing && status.kind === 'testing'}
              style={styles.saveButton}
            >
              Save &amp; Test
            </Button>

            <TouchableOpacity
              onPress={handleResetToDefault}
              disabled={saving}
              style={styles.resetButton}
            >
              <RotateCcw size={14} color={Theme.gray700} />
              <Text style={styles.resetText}>Reset to default</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  content: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  shell: { alignSelf: 'center' },
  shellNarrow: { width: '100%', maxWidth: 520 },
  intro: {
    fontSize: 14,
    color: Theme.mutedForeground,
    lineHeight: 21,
    marginBottom: 16,
  },
  card: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.foreground,
    marginBottom: 12,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: Theme.muted,
  },
  modeOptionActive: {
    borderColor: Theme.primary,
    backgroundColor: '#f2fdf7',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Theme.gray400,
    marginTop: 2,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Theme.primary },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.primary,
  },
  modeIcon: { marginRight: 10, marginTop: 2 },
  modeTitle: { fontSize: 15, fontWeight: '700', color: Theme.foreground },
  modeDescription: {
    fontSize: 12.5,
    color: Theme.mutedForeground,
    lineHeight: 18,
    marginTop: 2,
  },
  modeAddress: {
    fontSize: 12,
    color: Theme.gray700,
    marginTop: 6,
    fontWeight: '600',
  },
  localField: { marginTop: 4 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.gray700,
    marginBottom: 6,
  },
  inputHelp: {
    fontSize: 12,
    color: Theme.mutedForeground,
    marginTop: 6,
    lineHeight: 17,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
    minHeight: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  statusText: { flex: 1, fontSize: 13, color: Theme.mutedForeground, lineHeight: 19 },
  saveButton: { marginBottom: 10 },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    minHeight: 40,
  },
  resetText: { fontSize: 13, fontWeight: '600', color: Theme.gray700 },
});
