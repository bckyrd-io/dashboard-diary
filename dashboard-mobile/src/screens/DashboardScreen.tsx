import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Share,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
              {/* react-native-chart-kit BarChart on web expects a single dataset. Combine amounts into a single dataset matching chartLabels */}
              <BarChart
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      data: chartLabels.map((label) => {
                        const match = activitiesByType.find((a) => a.activityType === label);
                        return match ? match.totalAmount : 0;
                      }),
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
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ minWidth: '100%' }}>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.colDescription]}>Description</Text>
                <Text style={[styles.th, styles.colType]}>Type</Text>
                <Text style={[styles.th, styles.colStaff]}>Staff</Text>
                <Text style={[styles.th, styles.colAmount]}>Amount</Text>
                <Text style={[styles.th, styles.colDate]}>Date</Text>
              </View>
              {filtered.map((item, index) => (
                <View
                  key={item.activityId}
                  style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                >
                  <View style={styles.colDescription}>
                    <Text style={styles.tdDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    {item.resourcesUsed || item.involvedBranches ? (
                      <Text style={styles.tdSecondary} numberOfLines={1}>
                        {[item.resourcesUsed, item.involvedBranches].filter(Boolean).join(' • ')}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.colType}>
                    <StatusBadge status={item.activityType} />
                  </View>
                  <Text style={[styles.td, styles.colStaff]} numberOfLines={1}>
                    {item.assignedStaff || '—'}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      styles.colAmount,
                      { color: typeColors[item.activityType] ?? Theme.gray600, fontWeight: '700' },
                    ]}
                  >
                    MWK{Number(item.amount).toLocaleString()}
                  </Text>
                  <Text style={[styles.td, styles.colDate]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
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
  table: {
    backgroundColor: Theme.background,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Theme.muted,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
    alignItems: 'center',
    gap: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
    alignItems: 'center',
    gap: 8,
  },
  tableRowAlt: { backgroundColor: Theme.muted },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  td: { fontSize: 13, color: Theme.foreground },
  tdDescription: { fontSize: 13, fontWeight: '600', color: Theme.foreground },
  tdSecondary: { fontSize: 11, color: Theme.mutedForeground, marginTop: 2 },
  colDescription: { minWidth: 170, flex: 2 },
  colType: { minWidth: 96, flex: 1 },
  colStaff: { minWidth: 90, flex: 1 },
  colAmount: { minWidth: 110, flex: 1, textAlign: 'right' },
  colDate: { minWidth: 92, flex: 1, textAlign: 'right' },
});
