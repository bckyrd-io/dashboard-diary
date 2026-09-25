import React from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Search, Plus, CheckCircle2, X } from 'lucide-react-native';
import { ScreenHeader, Card, EmptyState, Button, StatusBadge } from '../components/ui';
import { Theme } from '../constants/Theme';
import { getEmployeeById, getCheckInsForStaff, getSalesForStaff } from '../services/staffData';
import { api } from '../services/api';

type ParamList = { StaffActivity: { staffId: number } };

type ActivityOption = {
  key: string;
  label: string;
  activityId?: number;
  source: 'activity' | 'category';
};

type AssignmentRow = {
  id: number;
  activity: string | null;
  status: string | null;
  updatedAt?: string;
};

export default function StaffActivityScreen() {
  const route = useRoute<RouteProp<ParamList, 'StaffActivity'>>();
  const navigation: any = useNavigation();
  const { staffId } = route.params;

  const [employee, setEmployee] = React.useState<any | null>(null);
  const [checkIns, setCheckIns] = React.useState<any[]>([]);
  const [sales, setSales] = React.useState<any[]>([]);

  const [options, setOptions] = React.useState<ActivityOption[]>([]);
  const [search, setSearch] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<ActivityOption | null>(null);
  const [assigning, setAssigning] = React.useState(false);
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = React.useState(true);
  const [resolvedUserId, setResolvedUserId] = React.useState<number | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const emp = await getEmployeeById(staffId);
      const cis = await getCheckInsForStaff(staffId);
      const ss = await getSalesForStaff(staffId);
      if (!mounted) return;
      setEmployee(emp);
      setCheckIns(cis || []);
      setSales(ss || []);
    })();
    return () => { mounted = false; };
  }, [staffId]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [activitiesRes, itemsRes, usersRes] = await Promise.all([
          api.get<{ success: boolean; activities: any[] }>('/api/activities').catch(() => ({ success: false, activities: [] } as any)),
          api.get<{ success: boolean; items: any[] }>('/api/items').catch(() => ({ success: false, items: [] } as any)),
          api.get<{ success: boolean; users: any[] }>('/api/users').catch(() => ({ success: false, users: [] } as any)),
        ]);
        if (!mounted) return;

        const map = new Map<string, ActivityOption>();
        for (const act of activitiesRes.activities || []) {
          const label = String(act.description ?? '').trim();
          if (!label) continue;
          if (!map.has(label.toLowerCase())) {
            map.set(label.toLowerCase(), {
              key: `act-${act.id}`,
              label,
              activityId: act.id,
              source: 'activity',
            });
          }
        }

        const categoryLabels = new Set<string>();
        for (const item of itemsRes.items || []) {
          const candidates = [item.subCategory, item.category];
          for (const raw of candidates) {
            const label = String(raw ?? '').trim();
            if (!label || label === 'physical-product') continue;
            categoryLabels.add(label);
          }
        }
        for (const label of categoryLabels) {
          const existing = map.get(label.toLowerCase());
          if (existing) continue;
          map.set(label.toLowerCase(), {
            key: `cat-${label}`,
            label,
            activityId: undefined,
            source: 'category',
          });
        }

        const user = (usersRes.users || []).find(
          (u: any) => u.username === employee?.username && u.role === 'Staff'
        ) ?? (usersRes.users || []).find((u: any) => u.username === employee?.username);
        if (user?.id) setResolvedUserId(user.id);

        setOptions(Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)));
      } catch {
        if (mounted) setLoadError('Could not load activities.');
      }
    })();
    return () => { mounted = false; };
  }, [employee?.username]);

  const fetchAssignments = React.useCallback(async (userId: number) => {
    setAssignmentsLoading(true);
    try {
      const res = await api.get<{ success: boolean; performance: any[] }>(
        `/api/performance?userId=${userId}`
      );
      const rows: AssignmentRow[] = (res.performance || [])
        .filter((p: any) => p.activity)
        .map((p: any) => ({
          id: p.id,
          activity: p.activity,
          status: p.status,
          updatedAt: p.updatedAt,
        }));
      setAssignments(rows);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (resolvedUserId) {
      fetchAssignments(resolvedUserId);
    } else {
      setAssignmentsLoading(false);
    }
  }, [resolvedUserId, fetchAssignments]);

  const filteredOptions = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const ensureActivityId = async (option: ActivityOption): Promise<number | null> => {
    if (option.activityId) return option.activityId;
    const today = new Date().toISOString().slice(0, 10);
    const created = await api.post<{ success: boolean; activity?: any[] }>('/api/activities', {
      description: option.label,
      activityType: 'Neutral',
      amount: 0,
      activityDate: today,
    });
    const createdActivity = created.activity?.[0];
    if (!created?.success || !createdActivity?.id) return null;
    return createdActivity.id;
  };

  const handleAssign = async () => {
    if (!selectedOption) return;
    if (!resolvedUserId) {
      Alert.alert(
        'No user account',
        'This staff member is not linked to a user account yet, so they cannot receive activity assignments.'
      );
      return;
    }
    setAssigning(true);
    setLoadError(null);
    try {
      const activityId = await ensureActivityId(selectedOption);
      if (!activityId) throw new Error('Could not create activity');
      const res = await api.post<{ success: boolean; message?: string }>('/api/performance', {
        userId: resolvedUserId,
        activityId,
        status: 'Assigned',
      });
      if (!res.success) throw new Error(res.message || 'Assignment failed');
      setSelectedOption(null);
      setSearch('');
      setDropdownOpen(false);
      await fetchAssignments(resolvedUserId);
      Alert.alert('Assigned', `${selectedOption.label} assigned to ${employee?.fullName ?? employee?.username ?? 'staff'}.`);
    } catch (err: any) {
      Alert.alert('Assign failed', err?.message || 'Could not assign activity.');
    } finally {
      setAssigning(false);
    }
  };

  const timeline = [
    // merge checkIns and sales chronologically
    ...checkIns.map((c) => ({ type: 'checkin' as const, time: c.timestamp, data: c })),
    ...sales.map((s) => ({ type: 'sale' as const, time: s.timestamp, data: s })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const renderAssignments = () => (
    <Card style={{ marginBottom: 12 }}>
      <Text style={styles.cardTitle}>Assigned Activities</Text>
      {assignmentsLoading ? (
        <ActivityIndicator color={Theme.primary} style={{ marginTop: 12 }} />
      ) : assignments.length === 0 ? (
        <Text style={styles.emptyAssignments}>No activities assigned yet</Text>
      ) : (
        assignments.map((row) => (
          <View key={row.id} style={styles.assignmentRow}>
            <CheckCircle2 size={16} color={Theme.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.assignmentActivity}>{row.activity}</Text>
              <Text style={styles.assignmentMeta}>
                {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : ''}
              </Text>
            </View>
            {row.status ? <StatusBadge status={row.status} /> : null}
          </View>
        ))
      )}
    </Card>
  );

  const renderAssignForm = () => (
    <Card style={{ marginBottom: 12 }}>
      <Text style={styles.cardTitle}>Assign Activity</Text>

      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setDropdownOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Search size={16} color={Theme.mutedForeground} />
        <Text style={[styles.dropdownTriggerText, selectedOption && styles.dropdownTriggerSelected]} numberOfLines={1}>
          {selectedOption ? selectedOption.label : 'Search activities or categories...'}
        </Text>
        {selectedOption ? (
          <TouchableOpacity onPress={() => setSelectedOption(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={Theme.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {dropdownOpen ? (
        <View style={styles.dropdownPanel}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Type to filter..."
            placeholderTextColor={Theme.mutedForeground}
            autoFocus
          />
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.key}
            style={{ maxHeight: 180 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyOptions}>No matching activities or categories</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionRow,
                  selectedOption?.key === item.key && styles.optionRowActive,
                ]}
                onPress={() => {
                  setSelectedOption(item);
                  setSearch('');
                  setDropdownOpen(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  <Text style={styles.optionSource}>
                    {item.source === 'activity' ? 'Existing activity' : 'Item category'}
                  </Text>
                </View>
                {item.source === 'category' ? <Plus size={14} color={Theme.mutedForeground} /> : null}
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}

      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

      <Button
        onPress={handleAssign}
        disabled={!selectedOption || assigning}
        loading={assigning}
        style={{ marginTop: 12 }}
      >
        Assign to Staff
      </Button>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.muted }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <ScreenHeader title={'Staff Activity'} back={() => navigation.goBack()} />
      </View>

      <FlatList
        data={timeline}
        keyExtractor={(item, idx) => `${item.type}-${idx}-${item.time}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <Card style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', color: Theme.foreground }}>{employee?.fullName ?? employee?.username ?? 'Employee'}</Text>
              <Text style={{ color: Theme.mutedForeground, marginTop: 6 }}>Recent NFC check-ins and POS sales</Text>
            </Card>
            {renderAssignForm()}
            {renderAssignments()}
            <Text style={styles.sectionLabel}>Timeline</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <EmptyState message="No activity yet" />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Text style={{ color: Theme.mutedForeground, fontSize: 12 }}>{new Date(item.time).toLocaleString()}</Text>
            {item.type === 'checkin' ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontWeight: '600', color: Theme.foreground }}>NFC Check-in</Text>
                <Text style={{ color: Theme.mutedForeground, marginTop: 4 }}>Tag: {item.data.tagId}</Text>
                <Text style={{ color: Theme.mutedForeground, marginTop: 4 }}>Workstation ID: {item.data.workstationId ?? '—'}</Text>
              </View>
            ) : (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontWeight: '600', color: Theme.foreground }}>Sale</Text>
                <Text style={{ color: Theme.mutedForeground, marginTop: 4 }}>Amount: ${item.data.amount.toFixed(2)}</Text>
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 14, fontWeight: '700', color: Theme.foreground, marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Theme.foreground, marginBottom: 8, marginTop: 4 },
  emptyAssignments: { fontSize: 13, color: Theme.mutedForeground },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  assignmentActivity: { fontSize: 14, fontWeight: '600', color: Theme.foreground },
  assignmentMeta: { fontSize: 11, color: Theme.mutedForeground, marginTop: 2 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    backgroundColor: Theme.muted,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownTriggerText: { flex: 1, fontSize: 14, color: Theme.mutedForeground },
  dropdownTriggerSelected: { color: Theme.foreground, fontWeight: '600' },
  dropdownPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    backgroundColor: Theme.background,
    overflow: 'hidden',
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.foreground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  optionRowActive: { backgroundColor: Theme.primaryLight },
  optionLabel: { fontSize: 14, color: Theme.foreground, fontWeight: '500' },
  optionSource: { fontSize: 11, color: Theme.mutedForeground, marginTop: 2 },
  emptyOptions: { padding: 14, fontSize: 13, color: Theme.mutedForeground, textAlign: 'center' },
  errorText: { fontSize: 12, color: Theme.destructive, marginTop: 8 },
});
