import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Database, Download, Upload, Info, RefreshCw } from 'lucide-react-native';
import { ScreenHeader, Card, Button } from '../components/ui';
import { Theme } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { isOfflineDbAvailable } from '../services/offline/db';
import { clearOfflineData } from '../services/offline/repository';
import {
  describeCounts,
  exportServerBackup,
  importServerBackup,
  isBackupCancelled,
  pickBackupFile,
  type ServerBackup,
} from '../services/backup';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    online,
    syncing,
    pending,
    failed,
    lastSyncedAt,
    syncNow,
    refreshStatus,
    retryFailed,
  } = useOffline();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const offlineAvailable = isOfflineDbAvailable();
  const isAdmin = user?.role?.trim().toLowerCase() === 'admin';
  const canBackup = Platform.OS !== 'web';

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus])
  );

  const messageOf = (error: unknown) =>
    error instanceof Error ? error.message : 'Something went wrong';

  const handleSyncNow = async () => {
    try {
      await syncNow();
    } catch (error) {
      Alert.alert('Sync failed', messageOf(error));
    }
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailed();
    } catch (error) {
      Alert.alert('Retry failed', messageOf(error));
    }
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      await exportServerBackup(user.id);
    } catch (error) {
      Alert.alert('Export failed', messageOf(error));
    } finally {
      setExporting(false);
    }
  };

  const performImport = async (backup: ServerBackup, userId: number) => {
    setImporting(true);
    try {
      const counts = await importServerBackup(userId, backup);
      // Wipe the local mirror and outbox first so stale queued changes can
      // never replay onto the freshly restored database, then pull it fresh.
      if (isOfflineDbAvailable()) {
        await clearOfflineData().catch(() => undefined);
      }
      await syncNow().catch(() => undefined);
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      Alert.alert(
        'Backup restored',
        `Server data replaced with ${total} records. Local cache resynced.`
      );
    } catch (error) {
      Alert.alert('Import failed', messageOf(error));
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (!user) return;
    try {
      const { backup, counts } = await pickBackupFile();
      Alert.alert(
        'Replace all server data?',
        `${counts.total} records in this backup will replace every current row on the server:\n\n${describeCounts(
          counts.counts
        )}\n\nThis cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace & restore',
            style: 'destructive',
            onPress: () => performImport(backup, user.id),
          },
        ]
      );
    } catch (error) {
      if (isBackupCancelled(error)) return;
      Alert.alert('Import failed', messageOf(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Settings" />

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <RefreshCw size={18} color={Theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Sync Status</Text>
              <Text style={styles.sectionSubtitle}>
                Offline changes queue on this device and sync automatically
                when you reconnect.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {offlineAvailable ? (
            <View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Connection</Text>
                <View style={styles.connectionValue}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: online ? '#16a34a' : '#dc2626' },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Pending changes</Text>
                <Text style={styles.accountValue}>{String(pending)}</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Failed changes</Text>
                <Text
                  style={[
                    styles.accountValue,
                    failed > 0 ? { color: '#dc2626' } : undefined,
                  ]}
                >
                  {String(failed)}
                </Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Last synced</Text>
                <Text style={styles.accountValue}>
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : '—'}
                </Text>
              </View>

              <Button
                onPress={handleSyncNow}
                disabled={!online || syncing}
                loading={syncing}
                style={styles.actionButton}
              >
                Sync now
              </Button>
              {failed > 0 ? (
                <Button
                  onPress={handleRetryFailed}
                  variant="outline"
                  disabled={!online || syncing}
                  loading={syncing}
                  style={styles.actionButton}
                >
                  Retry {failed} failed change{failed === 1 ? '' : 's'}
                </Button>
              ) : null}
              {!online ? (
                <Text style={styles.helperText}>
                  Reconnect to sync queued changes.
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.helperText}>
              Offline sync is not available on this platform. Use the mobile
              app for offline access.
            </Text>
          )}
        </Card>

        {isAdmin && canBackup ? (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Database size={18} color={Theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Offline Sync</Text>
                <Text style={styles.sectionSubtitle}>
                  Export app data to JSON or restore from a backup file when the network,
                  app, or database fails.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              <View style={styles.actionIcon}>
                <Download size={16} color={Theme.foreground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Export all data</Text>
                <Text style={styles.actionDescription}>
                  Download a JSON backup of branches, users, items, events, schedules,
                  performance, and notifications, then share it to Files, Drive, or chat.
                </Text>
              </View>
            </View>
            <Button
              onPress={handleExport}
              disabled={exporting || !online}
              loading={exporting}
              style={styles.actionButton}
            >
              Export to JSON
            </Button>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              <View style={styles.actionIcon}>
                <Upload size={16} color={Theme.foreground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Import from file</Text>
                <Text style={styles.actionDescription}>
                  Pick a previously exported JSON backup and replace server data with it.
                  Use only when recovering after data loss.
                </Text>
              </View>
            </View>
            <Button
              onPress={handleImport}
              variant="outline"
              disabled={importing || !online}
              loading={importing}
              style={styles.actionButton}
            >
              Import JSON backup
            </Button>

            <View style={styles.notice}>
              <Info size={14} color={Theme.mutedForeground} style={{ marginTop: 2 }} />
              <Text style={styles.noticeText}>
                Backups may include sensitive data such as password hashes. Share only with
                trusted destinations. Import replaces all data on the server.
              </Text>
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Username</Text>
            <Text style={styles.accountValue}>{user?.username ?? '—'}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Role</Text>
            <Text style={styles.accountValue}>{user?.role ?? '—'}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue} numberOfLines={1}>
              {user?.email ?? '—'}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  content: { padding: 16, paddingBottom: 40 },
  sectionCard: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Theme.foreground, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: Theme.mutedForeground, lineHeight: 18 },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Theme.muted,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '600', color: Theme.foreground },
  actionDescription: { fontSize: 12, color: Theme.mutedForeground, lineHeight: 17, marginTop: 2 },
  actionButton: { marginBottom: 4 },
  helperText: { fontSize: 12, color: Theme.mutedForeground, lineHeight: 17, marginTop: 8 },
  connectionValue: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 0 },
  notice: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  noticeText: { flex: 1, fontSize: 12, color: Theme.mutedForeground, lineHeight: 17 },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 2,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  accountLabel: { fontSize: 13, color: Theme.mutedForeground },
  accountValue: { fontSize: 13, fontWeight: '600', color: Theme.foreground, maxWidth: '60%', textAlign: 'right' },
});
