import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Database, Download, Upload, Info } from 'lucide-react-native';
import { ScreenHeader, Card, Button } from '../components/ui';
import { Theme } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    Alert.alert(
      'Offline Sync',
      'JSON export and share will be available here once offline sync is enabled.'
    );
  };

  const handleImport = () => {
    Alert.alert(
      'Offline Sync',
      'JSON file import and full restore will be available here once offline sync is enabled.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Settings" />

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
            disabled={exporting}
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
            disabled={importing}
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
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  accountLabel: { fontSize: 13, color: Theme.mutedForeground },
  accountValue: { fontSize: 13, fontWeight: '600', color: Theme.foreground, maxWidth: '60%', textAlign: 'right' },
});
