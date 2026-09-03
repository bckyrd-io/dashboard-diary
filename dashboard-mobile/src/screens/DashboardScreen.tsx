import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

interface DashboardData {
  totalBranches: number;
  totalStaff: number;
  totalResources: number;
  notifications: Array<{ notificationMessage: string }>;
  activity: Array<{ id: number; activity: string; status: string; username: string }>;
}

function StatCard({
  label,
  value,
  icon,
  bgColor,
}: {
  label: string;
  value: number | string;
  icon: string;
  bgColor: string;
}) {
  return (
    <View style={styles.statCardWrapper}>
      <Card style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
          <Text style={styles.statIconText}>{icon}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card>
    </View>
  );
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const result = await api.get<DashboardData>('/api/dashboard');
      setData(result);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />}
      >
        <ScreenHeader title="Dashboard" description="Overview of your farm operations" />

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        {data && (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Branches" value={data.totalBranches} icon="🌿" bgColor={Theme.successLight} />
              <StatCard label="Staff" value={data.totalStaff} icon="👷" bgColor={Theme.primaryLight} />
              <StatCard label="Resources" value={data.totalResources} icon="📦" bgColor={Theme.warningLight} />
            </View>

            {data.notifications && data.notifications.length > 0 && (
              <Card style={styles.notificationCard}>
                <Text style={styles.notificationTitle}>📣 Notifications</Text>
                {data.notifications.map((n, i) => (
                  <View key={i} style={styles.notificationRow}>
                    <Text style={styles.notificationBullet}>•</Text>
                    <Text style={styles.notificationText}>{n.notificationMessage}</Text>
                  </View>
                ))}
              </Card>
            )}

            {data.activity && data.activity.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Activities</Text>
                {data.activity.map((item) => (
                  <Card key={item.id} style={styles.activityCard}>
                    <View style={styles.activityRow}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>{item.activity}</Text>
                        <Text style={styles.activityUsername}>{item.username}</Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.gray50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
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
  errorCard: {
    backgroundColor: Theme.errorLight,
    borderColor: Theme.error,
  },
  errorText: {
    color: Theme.error,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCardWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.gray500,
    textAlign: 'center',
    marginTop: 4,
  },
  notificationCard: {
    marginBottom: 16,
    backgroundColor: Theme.warningLight,
    borderColor: Theme.warning,
  },
  notificationTitle: {
    fontWeight: 'bold',
    color: Theme.gray800,
    marginBottom: 8,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationBullet: {
    color: Theme.warning,
    marginRight: 8,
    marginTop: 2,
  },
  notificationText: {
    color: Theme.gray700,
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Theme.gray700,
    marginBottom: 12,
    fontSize: 16,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontWeight: '600',
    color: Theme.gray800,
  },
  activityUsername: {
    color: Theme.gray400,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Theme.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: Theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
