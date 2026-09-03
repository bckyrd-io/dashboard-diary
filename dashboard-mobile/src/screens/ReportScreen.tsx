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
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, Button, EmptyState, ScreenHeader, StatusBadge } from '../components/ui';
import { Theme } from '../constants/Theme';

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

const typeColors: Record<string, string> = {
  Revenue: Theme.success,
  Expense: Theme.error,
  Neutral: Theme.gray500,
};

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

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={s.loadingText}>Loading report...</Text>
      </View>
    );
  }

  return (
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
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search activities..."
          placeholderTextColor={Theme.gray400}
          style={s.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.activityId.toString()}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <EmptyState message="No activities found" />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={s.card}>
            <View style={s.cardTopRow}>
              <Text style={s.description} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[s.amount, { color: typeColors[item.activityType] ?? Theme.gray600 }]}>
                ${Number(item.amount).toLocaleString()}
              </Text>
            </View>

            <View style={s.badgeRow}>
              <StatusBadge status={item.activityType} />
              <Text style={s.dateText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {(item.resourcesUsed || item.assignedStaff || item.involvedBranches) && (
              <View style={s.detailSection}>
                {item.resourcesUsed && (
                  <Text style={s.detailText}>📦 {item.resourcesUsed}</Text>
                )}
                {item.assignedStaff && (
                  <Text style={s.detailText}>👷 {item.assignedStaff}</Text>
                )}
                {item.involvedBranches && (
                  <Text style={s.detailText}>🌿 {item.involvedBranches}</Text>
                )}
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

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
