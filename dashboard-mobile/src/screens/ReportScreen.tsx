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
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, EmptyState, ScreenHeader, StatusBadge } from '../components/ui';
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
    setFiltered(
      activities.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          a.activityType.toLowerCase().includes(q) ||
          (a.assignedStaff ?? '').toLowerCase().includes(q)
      )
    );
  }, [search, activities]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const exportReport = async () => {
    const lines = filtered.map(
      (a) =>
        `[${a.activityId}] ${a.description} | ${a.activityType} | $${a.amount} | ${new Date(a.createdAt).toLocaleDateString()}`
    );
    await Share.share({
      message: `Farm Activity Report\nGenerated: ${new Date().toLocaleDateString()}\n\n${lines.join('\n')}`,
      title: 'Farm Activity Report',
    });
  };

  const typeColors: Record<string, string> = {
    Revenue: Theme.success,
    Expense: Theme.destructive,
    Neutral: Theme.mutedForeground,
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingBottom: 8 }}>
        <ScreenHeader
          title="Reports"
          description={`${filtered.length} activities found`}
          action={
            <TouchableOpacity onPress={exportReport} style={styles.exportBtn}>
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          }
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search activities..."
          placeholderTextColor={Theme.mutedForeground}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.activityId.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <EmptyState message="No activities found" />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[styles.cardAmount, { color: typeColors[item.activityType] ?? Theme.gray600 }]}>
                ${Number(item.amount).toLocaleString()}
              </Text>
            </View>

            <View style={styles.cardMeta}>
              <StatusBadge status={item.activityType} />
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {(item.resourcesUsed || item.assignedStaff || item.involvedBranches) && (
              <View style={styles.detailsBox}>
                {item.resourcesUsed ? (
                  <Text style={styles.detailText}>📦 {item.resourcesUsed}</Text>
                ) : null}
                {item.assignedStaff ? (
                  <Text style={styles.detailText}>👷 {item.assignedStaff}</Text>
                ) : null}
                {item.involvedBranches ? (
                  <Text style={styles.detailText}>🌿 {item.involvedBranches}</Text>
                ) : null}
              </View>
            )}
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
  exportBtn: {
    backgroundColor: Theme.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Theme.radius,
  },
  exportText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchInput: {
    marginHorizontal: 16, borderWidth: 1, borderColor: Theme.border, borderRadius: Theme.radius,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Theme.background,
    color: Theme.foreground, fontSize: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontWeight: '600', color: Theme.foreground, flex: 1, marginRight: 8, fontSize: 14, lineHeight: 20 },
  cardAmount: { fontWeight: 'bold', fontSize: 15 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardDate: { color: Theme.mutedForeground, fontSize: 12 },
  detailsBox: {
    backgroundColor: Theme.muted, borderRadius: Theme.radius, paddingHorizontal: 12, paddingVertical: 8, gap: 4,
  },
  detailText: { color: Theme.mutedForeground, fontSize: 12 },
});
