import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card, EmptyState, ScreenHeader, StatusBadge, Button } from '../components/ui';
import { Theme } from '../constants/Theme';
import { nfcService } from '../services/nfcService';
import {
  getEmployees,
  getWorkstations,
  getCheckIns,
  getSales,
  addCheckIn,
  findWorkstationByTag,
  ensureEmployeeForUsername,
  Employee,
} from '../services/staffData';
import { useAuth } from '../context/AuthContext';
import { Tag } from 'lucide-react-native';

function formatTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
}

function presenceStatusFromTimestamp(iso?: string) {
  if (!iso) return 'Needs Check';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes <= 10) return 'Active';
  if (minutes <= 30) return 'Idle';
  return 'Needs Check';
}

export default function StaffScreen() {
  const navigation: any = useNavigation();
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workstations, setWorkstations] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [emps, wss, cis, ss] = await Promise.all([getEmployees(), getWorkstations(), getCheckIns(), getSales()]);
      setEmployees(emps || []);
      setWorkstations(wss || []);
      setCheckIns(cis || []);
      setSales(ss || []);
    } catch (err) {
      console.warn('Error loading staff data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      // Try reading product tag first (workstation tag)
      const result = await nfcService.readProductTag();
      if (!result || !result.success) throw new Error(result?.error || 'No tag read');

      const tagId: string = result.tagId ?? `TAG-${Date.now().toString(36).toUpperCase()}`;

      // Find workstation by tag; if tag belongs to workstation, associate
      const ws = await findWorkstationByTag(tagId);

      // Determine staff performing scan: prefer logged-in user
      let staffId: number;
      if (user?.id) {
        // try to find employee with same numeric id
        const emp = employees.find((e) => e.id === user.id);
        if (emp) {
          staffId = emp.id;
        } else {
          // ensure employee exists for username
          const ensured = ensureEmployeeForUsername(user.username);
          staffId = ensured.id;
        }
      } else {
        // Unknown user -> create/ensure by generic name
        const ensured = ensureEmployeeForUsername('unknown');
        staffId = ensured.id;
      }

      // Add check-in
      await addCheckIn(staffId, tagId, ws?.id);

      // refresh local state
      await loadAll();
    } catch (err: any) {
      setError(err?.message ?? 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  // Build staff dashboard items combining latest check-in and sales summary
  const dashboardItems = employees.map((emp) => {
    const empCheckIns = checkIns.filter((c: any) => c.staffId === emp.id);
    const latest = empCheckIns[0]?.timestamp;
    const status = presenceStatusFromTimestamp(latest);
    const empSales = sales.filter((s: any) => s.staffId === emp.id);
    const salesCount = empSales.length;
    const salesAmount = empSales.reduce((s: number, r: any) => s + r.amount, 0);
    const ws = workstations.find((w) => w.id === emp.workstationId) || null;
    return {
      ...emp,
      workstationName: ws?.name ?? 'Unassigned',
      latestCheckIn: latest,
      status,
      salesCount,
      salesAmount,
    };
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading staff accountability...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <ScreenHeader title="NFC Staff Accountability" />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Button onPress={handleScan} loading={scanning} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Tag size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Scan NFC</Text>
          </View>
        </Button>
        {error ? (
          <Card style={{ backgroundColor: '#fff6f6', borderColor: '#ffdddd' }}>
            <Text style={{ color: Theme.destructive }}>{error}</Text>
          </Card>
        ) : null}
      </View>

      <FlatList
        data={dashboardItems}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 64 }}><EmptyState message="No staff found" /></View>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('StaffActivity', { staffId: item.id })}>
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.staffName}>{item.fullName ?? item.username}</Text>
                  <Text style={styles.branchName}>{item.workstationName}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Last check-in</Text>
                  <Text style={styles.metaValue}>{formatTime(item.latestCheckIn)}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: Theme.border, marginHorizontal: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Sales</Text>
                  <Text style={styles.metaValue}>{item.salesCount} • ${item.salesAmount.toFixed(2)}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
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
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  metaLabel: { color: Theme.mutedForeground, fontSize: 12 },
  metaValue: { color: Theme.foreground, fontSize: 14, fontWeight: '600', marginTop: 4 },
});
