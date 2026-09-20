import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TextInput,
  Share,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { api } from '../services/api';
import { Card, ScreenHeader, StatusBadge } from '../components/ui';
import { Theme } from '../constants/Theme';

interface ActivityByType {
  activityType: string;
  totalAmount: number;
  activities: string[];
}

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

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [activitiesByType, setActivitiesByType] = useState<ActivityByType[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityListItem[]>([]);
  const [filtered, setFiltered] = useState<ActivityListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const result = await api.get<{ activitiesByType: ActivityByType[]; activitiesList: ActivityListItem[] }>('/api/dashboard');
      setActivitiesByType(result.activitiesByType ?? []);
      setActivitiesList(result.activitiesList ?? []);
      setFiltered(result.activitiesList ?? []);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      activitiesList.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          a.activityType.toLowerCase().includes(q) ||
          (a.assignedStaff ?? '').toLowerCase().includes(q)
      )
    );
  }, [search, activitiesList]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Calculate revenue, expense, net profit
  let revenue = 0;
  let expense = 0;
  activitiesByType.forEach((a) => {
    if (a.activityType === 'Revenue') revenue += a.totalAmount;
    else if (a.activityType === 'Expense') expense += a.totalAmount;
  });
  const netProfit = revenue - expense;

  // Prepare chart data
  const chartLabels = activitiesByType
    .filter((a) => a.activityType !== 'Neutral')
    .map((a) => a.activityType);
  const chartRevenue = activitiesByType
    .filter((a) => a.activityType === 'Revenue')
    .map((a) => a.totalAmount);
  const chartExpense = activitiesByType
    .filter((a) => a.activityType === 'Expense')
    .map((a) => a.totalAmount);

  const hasChartData = chartLabels.length > 0;

  const exportReport = async () => {
    const lines = filtered.map(
      (a) =>
        `[${a.activityId}] ${a.description} | ${a.activityType} | MWK${a.amount} | ${new Date(a.createdAt).toLocaleDateString()}`
    );
    await Share.share({
      message: `Activity Report\nGenerated: ${new Date().toLocaleDateString()}\n\n${lines.join('\n')}`,
      title: 'Activity Report',
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
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
      >
        <ScreenHeader title="Analytics" description="Overview of your operations" />

        {error ? (
          <Card style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', marginBottom: 16 }}>
            <Text style={{ color: Theme.destructive, textAlign: 'center' }}>{error}</Text>
          </Card>
        ) : null}

        {/* Stat Cards — Revenue / Expense / Net Profit */}
        <View style={styles.statsRow}>
          {activitiesByType.map((activity) => (
            <Card key={activity.activityType} style={styles.statCard}>
              <Text style={styles.statLabel}>{activity.activityType}</Text>
              <Text style={[styles.statValue, { color: activity.activityType === 'Expense' ? Theme.destructive : Theme.primary }]}>
                MWK{activity.totalAmount.toLocaleString()}
              </Text>
            </Card>
          ))}
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Net Profit</Text>
            <Text style={[styles.statValue, { color: netProfit >= 0 ? Theme.primary : Theme.destructive }]}>
              MWK{netProfit.toLocaleString()}
            </Text>
          </Card>
        </View>

        {/* Bar Chart */}
        {hasChartData && (
          <Card style={{ marginTop: 16, padding: 16 }}>
            <Text style={styles.chartTitle}>Metrics Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      data: chartRevenue.length > 0 ? chartRevenue : [0],
                      color: () => Theme.primary,
                    },
                    {
                      data: chartExpense.length > 0 ? chartExpense : [0],
                      color: () => '#ff4d4d',
                    },
                  ],
                }}
                width={Math.max(screenWidth - 64, chartLabels.length * 100)}
                height={220}
                yAxisLabel="MWK"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: Theme.background,
                  backgroundGradientFrom: Theme.background,
                  backgroundGradientTo: Theme.background,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: () => Theme.mutedForeground,
                  barPercentage: 0.6,
                  propsForBackgroundLines: {
                    strokeDasharray: '4',
                    stroke: Theme.gray200,
                  },
                }}
                style={{ borderRadius: Theme.radius }}
                fromZero
              />
            </ScrollView>
            {/* Custom Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Theme.primary }]} />
                <Text style={styles.legendText}>Revenue</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ff4d4d' }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
            </View>
          </Card>
        )}

        {!hasChartData && !error && (
          <Card style={{ marginTop: 16, padding: 32, alignItems: 'center' }}>
            <Text style={{ color: Theme.mutedForeground }}>No activity data to display</Text>
          </Card>
        )}

        {/* Activities Report Section */}
        <View style={styles.reportSection}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Activities ({filtered.length})</Text>
            <TouchableOpacity onPress={exportReport} style={styles.exportBtn}>
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search activities..."
            placeholderTextColor={Theme.mutedForeground}
            style={styles.searchInput}
          />
          {filtered.map((item) => (
            <Card key={item.activityId} style={{ marginBottom: 12 }}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[styles.cardAmount, { color: typeColors[item.activityType] ?? Theme.gray600 }]}>
                  MWK{Number(item.amount).toLocaleString()}
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
                    <Text style={styles.detailText}>Resources: {item.resourcesUsed}</Text>
                  ) : null}
                  {item.assignedStaff ? (
                    <Text style={styles.detailText}>Staff: {item.assignedStaff}</Text>
                  ) : null}
                  {item.involvedBranches ? (
                    <Text style={styles.detailText}>Branches: {item.involvedBranches}</Text>
                  ) : null}
                </View>
              )}
            </Card>
          ))}
          {filtered.length === 0 && !loading && (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: Theme.mutedForeground }}>No activities found</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.muted },
  loadingText: { color: Theme.mutedForeground, marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { minWidth: '47%', flexGrow: 1, padding: 16 },
  statLabel: { fontSize: 14, fontWeight: '600', color: Theme.gray700, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.gray700, marginBottom: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 13, color: Theme.mutedForeground },
  reportSection: { marginTop: 16 },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.gray700 },
  exportBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius,
  },
  exportText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchInput: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Theme.background,
    color: Theme.foreground,
    fontSize: 14,
    marginBottom: 12,
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
