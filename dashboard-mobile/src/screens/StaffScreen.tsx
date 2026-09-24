import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { Card, EmptyState, ScreenHeader, StatusBadge } from '../components/ui';
import { Theme } from '../constants/Theme';

interface PerformanceData {
  id: number;
  userId: number;
  username: string;
  branch_name: string;
  activity: string;
  status: string;
  updatedAt: string;
}

export default function StaffScreen() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPerformance = async () => {
    try {
      const result = await api.get<{ performance: PerformanceData[] }>('/api/performance');
      const grouped: Record<string, PerformanceData[]> = {};
      result.performance.forEach((item) => {
        const key = `${item.userId}-${item.activity}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      const latest = Object.values(grouped).map((group) =>
        group.reduce((a, b) => (new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a))
      );
      setData(latest);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load staff performance.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPerformance(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchPerformance(); };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading staff data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <ScreenHeader title="Staff Performance" description="Latest activity status per staff member" />
      </View>

      {error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Card style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <Text style={{ color: Theme.destructive, textAlign: 'center' }}>{error}</Text>
          </Card>
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <EmptyState message="No staff data found" />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.staffName}>{item.username}</Text>
                <Text style={styles.branchName}>{item.branch_name}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.activityBox}>
              <Text style={styles.activityText}>{item.activity}</Text>
            </View>
            <Text style={styles.dateText}>
              Updated: {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.muted },
  loadingText: { color: Theme.mutedForeground, marginTop: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  staffName: { fontWeight: 'bold', color: Theme.foreground, fontSize: 15 },
  branchName: { color: Theme.primary, fontSize: 12, fontWeight: '500', marginTop: 2 },
  activityBox: {
    backgroundColor: Theme.muted, borderRadius: Theme.radius, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4,
  },
  activityText: { color: Theme.gray600, fontSize: 14 },
  dateText: { color: Theme.mutedForeground, fontSize: 12, marginTop: 8, textAlign: 'right' },
});
