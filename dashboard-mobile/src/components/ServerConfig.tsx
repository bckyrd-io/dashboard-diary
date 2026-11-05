// Server-address setup card for the standalone LAN build: auto-discovers the
// PC running the API by scanning the local subnet, with a manual address
// field as fallback. Only rendered when the build has no baked API URL.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Radar, CheckCircle2, XCircle } from 'lucide-react-native';
import { Card, Button } from './ui';
import { Theme } from '../constants/Theme';
import {
  findServer,
  getServerUrl,
  isValidServerUrl,
  normalizeUrl,
  requiresServerConfig,
  setServerUrl,
  testServerUrl,
} from '../config/serverUrl';

type Status = { kind: 'ok' | 'err' | 'info'; text: string } | null;

const RESCAN_DEBOUNCE_MS = 15000;

export function ServerConfig() {
  const [url, setUrl] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [scanning, setScanning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState<{ tested: number; total: number } | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const scanningRef = useRef(false);
  const lastScanAtRef = useRef(0);
  const mountedRef = useRef(true);

  const runScan = useCallback(async (force = false) => {
    if (scanningRef.current) return;
    const now = Date.now();
    if (!force && now - lastScanAtRef.current < RESCAN_DEBOUNCE_MS) return;
    scanningRef.current = true;
    lastScanAtRef.current = now;
    setScanning(true);
    setProgress(null);
    setStatus({ kind: 'info', text: 'Looking for the server on this network…' });
    try {
      const found = await findServer((tested, total) => setProgress({ tested, total }));
      if (!mountedRef.current) return;
      if (found) {
        setUrl(found);
        setManual('');
        setStatus({ kind: 'ok', text: `Connected to ${found}` });
      } else {
        setStatus({
          kind: 'err',
          text: 'No server found. Make sure the API is running on your PC, then try again or type the address below.',
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setStatus({
          kind: 'err',
          text: error instanceof Error ? error.message : 'Scan failed. Try entering the address manually.',
        });
      }
    } finally {
      scanningRef.current = false;
      if (mountedRef.current) {
        setScanning(false);
        setProgress(null);
      }
    }
  }, []);

  // Load the saved address; auto-scan once if this build has never been
  // pointed at a server.
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const stored = await getServerUrl();
      if (!mountedRef.current) return;
      setUrl(stored);
      if (!stored && requiresServerConfig()) {
        await runScan();
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [runScan]);

  // When the device joins a different network, re-check the saved address and
  // re-scan automatically if it no longer answers (e.g. the PC's IP changed).
  useEffect(() => {
    if (!requiresServerConfig()) return;
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected || scanningRef.current) return;
      (async () => {
        const stored = await getServerUrl();
        if (!mountedRef.current) return;
        if (!stored) {
          await runScan();
          return;
        }
        const reachable = await testServerUrl(stored, 2500);
        if (!mountedRef.current) return;
        if (reachable) {
          setUrl(stored);
          setStatus({ kind: 'ok', text: `Connected to ${stored}` });
        } else {
          await runScan();
        }
      })();
    });
    return unsubscribe;
  }, [runScan]);

  const handleManualSave = async () => {
    const candidate = normalizeUrl(manual);
    if (!isValidServerUrl(candidate)) {
      setStatus({ kind: 'err', text: 'Enter a valid address like http://192.168.1.10:3000' });
      return;
    }
    setTesting(true);
    setStatus({ kind: 'info', text: `Testing ${candidate}…` });
    try {
      const reachable = await testServerUrl(candidate);
      const saved = await setServerUrl(candidate);
      if (!mountedRef.current) return;
      setUrl(saved);
      setManual('');
      setStatus(
        reachable
          ? { kind: 'ok', text: `Connected to ${saved}` }
          : { kind: 'err', text: 'Address saved, but no server answered at it. Check that the API is running and the port is 3000.' }
      );
    } catch (error) {
      if (mountedRef.current) {
        setStatus({ kind: 'err', text: error instanceof Error ? error.message : 'Could not save address' });
      }
    } finally {
      if (mountedRef.current) setTesting(false);
    }
  };

  if (!requiresServerConfig()) return null;

  const StatusIcon =
    status?.kind === 'ok' ? CheckCircle2 : status?.kind === 'err' ? XCircle : null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Radar size={18} color={Theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Server address</Text>
          <Text style={styles.subtitle}>
            This build connects to your PC over the local network. The address is found
            automatically and can be changed any time.
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.currentRow}>
        <Text style={styles.currentLabel}>Current</Text>
        <Text style={[styles.currentValue, !url && styles.currentEmpty]} numberOfLines={1}>
          {url ?? 'Not configured'}
        </Text>
      </View>

      {!!status && (
        <View style={styles.statusRow}>
          {scanning ? (
            <ActivityIndicator size="small" color={Theme.mutedForeground} />
          ) : StatusIcon ? (
            <StatusIcon
              size={14}
              color={status.kind === 'ok' ? '#16a34a' : Theme.destructive}
            />
          ) : null}
          <Text
            style={[
              styles.statusText,
              status.kind === 'ok' && { color: '#16a34a' },
              status.kind === 'err' && { color: Theme.destructive },
            ]}
          >
            {status.text}
            {scanning && progress ? ` (${progress.tested}/${progress.total})` : ''}
          </Text>
        </View>
      )}

      <Button
        onPress={() => runScan(true)}
        variant="outline"
        loading={scanning}
        disabled={testing}
        style={styles.button}
      >
        {scanning ? 'Scanning…' : 'Find server'}
      </Button>

      <Text style={styles.inputLabel}>Server address</Text>
      <View style={styles.manualRow}>
        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder="http://192.168.1.10:3000"
          placeholderTextColor={Theme.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
        />
        <Button
          onPress={handleManualSave}
          loading={testing}
          disabled={scanning || !manual.trim()}
          style={styles.saveButton}
        >
          Save
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: Theme.foreground },
  subtitle: { fontSize: 12, color: Theme.mutedForeground, marginTop: 2, lineHeight: 17 },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: 12 },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  currentLabel: { fontSize: 13, color: Theme.mutedForeground },
  currentValue: { fontSize: 13, fontWeight: '600', color: Theme.foreground, maxWidth: '65%' },
  currentEmpty: { color: Theme.mutedForeground, fontWeight: '400' },
  statusRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginBottom: 12 },
  statusText: { flex: 1, fontSize: 12.5, color: Theme.mutedForeground, lineHeight: 18 },
  button: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Theme.gray700, marginBottom: 6 },
  manualRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Theme.muted,
    color: Theme.foreground,
    fontSize: 14,
  },
  saveButton: { paddingHorizontal: 16 },
});
