import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
<<<<<<< Updated upstream
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
=======
} from 'react-native';
import { api } from '../services/api';
import { Card, ScreenHeader } from '../components/ui';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  bgColor,
=======
  bg,
>>>>>>> Stashed changes
}: {
  label: string;
  value: number | string;
  icon: string;
<<<<<<< Updated upstream
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
=======
  bg: string;
}) {
  return (
    <View className="flex-1 mx-1">
      <Card className="items-center py-5">
        <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${bg}`}>
          <Text className="text-2xl">{icon}</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900">{value}</Text>
        <Text className="text-xs text-gray-500 text-center mt-1">{label}</Text>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
=======
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#33b76d" />
        <Text className="text-gray-500 mt-3">Loading dashboard...</Text>
>>>>>>> Stashed changes
      </View>
    );
  }

  return (
<<<<<<< Updated upstream
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
=======
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#33b76d" />}
      >
        {/* Header */}
        <ScreenHeader title="Dashboard" description="Overview of your farm operations" />

        {error ? (
          <Card className="bg-red-50 border-red-200">
            <Text className="text-red-600 text-center">{error}</Text>
>>>>>>> Stashed changes
          </Card>
        ) : null}

        {data && (
          <>
<<<<<<< Updated upstream
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
=======
            {/* Stats Row */}
            <View className="flex-row mb-4">
              <StatCard label="Branches" value={data.totalBranches} icon="🌿" bg="bg-green-100" />
              <StatCard label="Staff" value={data.totalStaff} icon="👷" bg="bg-blue-100" />
              <StatCard label="Resources" value={data.totalResources} icon="📦" bg="bg-yellow-100" />
            </View>

            {/* Notifications */}
            {data.notifications && data.notifications.length > 0 && (
              <Card className="mb-4 border-yellow-200 bg-yellow-50">
                <Text className="font-bold text-yellow-800 mb-2">📣 Notifications</Text>
                {data.notifications.map((n, i) => (
                  <View key={i} className="flex-row items-start mb-1">
                    <Text className="text-yellow-500 mr-2 mt-0.5">•</Text>
                    <Text className="text-yellow-700 text-sm flex-1">{n.notificationMessage}</Text>
>>>>>>> Stashed changes
                  </View>
                ))}
              </Card>
            )}

<<<<<<< Updated upstream
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
=======
            {/* Recent Activity */}
            {data.activity && data.activity.length > 0 && (
              <>
                <Text className="font-bold text-gray-700 mb-3 text-base">Recent Activities</Text>
                {data.activity.map((item) => (
                  <Card key={item.id} className="mb-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">{item.activity}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">{item.username}</Text>
                      </View>
                      <View className="bg-primary-light px-3 py-1 rounded-full">
                        <Text className="text-primary text-xs font-semibold">{item.status}</Text>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

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
=======
>>>>>>> Stashed changes
