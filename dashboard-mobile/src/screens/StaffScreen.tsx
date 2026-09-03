import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
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
      const result = await api.get<{ performance: PerformanceData[] }>(
        '/api/performance'
      );
      const grouped: Record<string, PerformanceData[]> = {};

      result.performance.forEach((item) => {
        const key = `${item.userId}-${item.activity}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

      const latest = Object.values(grouped).map((group) =>
        group.reduce((a, b) =>
          new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a
        )
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

  useEffect(() => {
    fetchPerformance();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPerformance();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading staff data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <ScreenHeader
          title="Staff Performance"
          description="Latest activity status per staff member"
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState message="No staff data found" />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <View style={styles.staffInfo}>
                <Text style={styles.staffUsername}>{item.username}</Text>
                <Text style={styles.staffBranch}>{item.branch_name}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.activityContainer}>
              <Text style={styles.activityText}>{item.activity}</Text>
            </View>
            <Text style={styles.updatedText}>
              Updated: {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.gray50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.gray50,
  },
  loadingText: {
    color: Theme.gray500,
    marginTop: 12,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  errorContainer: {
    paddingHorizontal: 16,
  },
  errorCard: {
    backgroundColor: Theme.errorLight,
    borderColor: '#fecaca',
  },
  errorText: {
    color: Theme.error,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  staffCard: {
    marginBottom: 12,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  staffInfo: {
    flex: 1,
    marginRight: 12,
  },
  staffUsername: {
    fontWeight: 'bold',
    color: Theme.gray900,
    fontSize: 16,
  },
  staffBranch: {
    color: Theme.primary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  activityContainer: {
    backgroundColor: Theme.gray50,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  activityText: {
    color: Theme.gray600,
    fontSize: 14,
  },
  updatedText: {
    color: Theme.gray400,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
});
