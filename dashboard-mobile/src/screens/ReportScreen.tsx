import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Share,
<<<<<<< Updated upstream
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, Button, EmptyState, ScreenHeader, StatusBadge } from '../components/ui';
import { Theme } from '../constants/Theme';
=======
  TouchableOpacity,
} from 'react-native';
import { api } from '../services/api';
import { Card, EmptyState, ScreenHeader, StatusBadge } from '../components/ui';
>>>>>>> Stashed changes

interface ActivityListItem {
  activityId: number;
  activityType: string;
  description: string;
  amount: number;
  createdAt: string;
  resourcesUsed: string;
  assignedStaff: string;
  upcomingDates: string;
  involvedBranches: string;
}

<<<<<<< Updated upstream
const typeColors: Record<string, string> = {
  Revenue: Theme.success,
  Expense: Theme.error,
  Neutral: Theme.gray500,
};

=======
>>>>>>> Stashed changes
export default function ReportScreen() {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [filtered, setFiltered] = useState<ActivityListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const result = await api.get<{ activitiesList: ActivityListItem[] }>('/api/dashboard');
      setActivities(result.activitiesList ?? []);
      setFiltered(result.activitiesList ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(activities.filter(a =>
      a.description.toLowerCase().includes(q) ||
      a.activityType.toLowerCase().includes(q) ||
      (a.assignedStaff ?? '').toLowerCase().includes(q)
    ));
  }, [search, activities]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const exportReport = async () => {
    const lines = filtered.map(a =>
      `[${a.activityId}] ${a.description} | ${a.activityType} | $${a.amount} | ${new Date(a.createdAt).toLocaleDateString()}`
    );
    await Share.share({
      message: `Farm Activity Report\nGenerated: ${new Date().toLocaleDateString()}\n\n${lines.join('\n')}`,
      title: 'Farm Activity Report',
    });
  };

<<<<<<< Updated upstream
  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={s.loadingText}>Loading report...</Text>
=======
  const typeColors: Record<string, string> = {
    Revenue: 'text-green-600',
    Expense: 'text-red-500',
    Neutral: 'text-gray-500',
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#33b76d" />
        <Text className="text-gray-500 mt-3">Loading report...</Text>
>>>>>>> Stashed changes
      </View>
    );
  }

  return (
<<<<<<< Updated upstream
    <SafeAreaView style={s.safeArea}>
      <View style={s.topSection}>
        <ScreenHeader
          title="Reports"
          description={`${filtered.length} activities found`}
          action={
            <Button variant="default" onPress={exportReport}>
              <Text style={s.exportButtonText}>Export</Text>
            </Button>
          }
        />
=======
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="pb-2">
        <ScreenHeader title="Reports" description={`${filtered.length} activities found`} action={<TouchableOpacity
            onPress={exportReport}
            className="bg-primary px-3 py-2.5 rounded-md flex-row items-center"
          >
            <Text className="text-white text-sm font-semibold">Export</Text>
          </TouchableOpacity>} />
>>>>>>> Stashed changes
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search activities..."
<<<<<<< Updated upstream
          placeholderTextColor={Theme.gray400}
          style={s.searchInput}
=======
          placeholderTextColor="#9ca3af"
          className="mx-4 border border-gray-300 rounded-md px-3 py-2.5 bg-white text-gray-900 text-sm"
>>>>>>> Stashed changes
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.activityId.toString()}
<<<<<<< Updated upstream
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={s.emptyContainer}>
=======
        contentContainerClassName="px-4 pb-10 pt-2"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#33b76d" />}
        ListEmptyComponent={
          <View className="items-center py-16">
>>>>>>> Stashed changes
            <EmptyState message="No activities found" />
          </View>
        }
        renderItem={({ item }) => (
<<<<<<< Updated upstream
          <Card style={s.card}>
            <View style={s.cardTopRow}>
              <Text style={s.description} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[s.amount, { color: typeColors[item.activityType] ?? Theme.gray600 }]}>
=======
          <Card className="mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <Text className="font-semibold text-gray-900 flex-1 mr-2 text-sm leading-snug">
                {item.description}
              </Text>
              <Text className={`font-bold text-base ${typeColors[item.activityType] ?? 'text-gray-600'}`}>
>>>>>>> Stashed changes
                ${Number(item.amount).toLocaleString()}
              </Text>
            </View>

<<<<<<< Updated upstream
            <View style={s.badgeRow}>
              <StatusBadge status={item.activityType} />
              <Text style={s.dateText}>
=======
            <View className="flex-row items-center gap-2 mb-2">
              <StatusBadge status={item.activityType} />
              <Text className="text-gray-400 text-xs">
>>>>>>> Stashed changes
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {(item.resourcesUsed || item.assignedStaff || item.involvedBranches) && (
<<<<<<< Updated upstream
              <View style={s.detailSection}>
                {item.resourcesUsed && (
                  <Text style={s.detailText}>📦 {item.resourcesUsed}</Text>
                )}
                {item.assignedStaff && (
                  <Text style={s.detailText}>👷 {item.assignedStaff}</Text>
                )}
                {item.involvedBranches && (
                  <Text style={s.detailText}>🌿 {item.involvedBranches}</Text>
=======
              <View className="bg-gray-50 rounded-lg px-3 py-2 gap-1">
                {item.resourcesUsed && (
                  <Text className="text-gray-500 text-xs">📦 {item.resourcesUsed}</Text>
                )}
                {item.assignedStaff && (
                  <Text className="text-gray-500 text-xs">👷 {item.assignedStaff}</Text>
                )}
                {item.involvedBranches && (
                  <Text className="text-gray-500 text-xs">🌿 {item.involvedBranches}</Text>
>>>>>>> Stashed changes
                )}
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
<<<<<<< Updated upstream

const s = StyleSheet.create({
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
  topSection: {
    paddingBottom: 8,
  },
  exportButtonText: {
    color: Theme.background,
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Theme.gray300,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Theme.background,
    color: Theme.gray900,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  card: {
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  description: {
    fontWeight: '600',
    color: Theme.gray900,
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    color: Theme.gray400,
    fontSize: 12,
  },
  detailSection: {
    backgroundColor: Theme.gray50,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  detailText: {
    color: Theme.gray500,
    fontSize: 12,
  },
});
=======
>>>>>>> Stashed changes
