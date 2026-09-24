import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { ScreenHeader, Card, EmptyState } from '../components/ui';
import { Theme } from '../constants/Theme';
import { getEmployeeById, getCheckInsForStaff, getSalesForStaff } from '../services/staffData';

type ParamList = { StaffActivity: { staffId: number } };

export default function StaffActivityScreen() {
  const route = useRoute<RouteProp<ParamList, 'StaffActivity'>>();
  const navigation: any = useNavigation();
  const { staffId } = route.params;

  const [employee, setEmployee] = React.useState<any | null>(null);
  const [checkIns, setCheckIns] = React.useState<any[]>([]);
  const [sales, setSales] = React.useState<any[]>([]);

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

  const timeline = [
    // merge checkIns and sales chronologically
    ...checkIns.map((c) => ({ type: 'checkin' as const, time: c.timestamp, data: c })),
    ...sales.map((s) => ({ type: 'sale' as const, time: s.timestamp, data: s })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.muted }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <ScreenHeader title={'Staff Activity'} description="Chronological activity and NFC check-ins" back={() => navigation.goBack()} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Card>
          <Text style={{ fontWeight: '600', color: Theme.foreground }}>{employee?.fullName ?? employee?.username ?? 'Employee'}</Text>
          <Text style={{ color: Theme.mutedForeground, marginTop: 6 }}>Recent NFC check-ins and POS sales</Text>
        </Card>
      </View>

      <FlatList
        data={timeline}
        keyExtractor={(item, idx) => `${item.type}-${idx}-${item.time}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 64 }}><EmptyState message="No activity yet" /></View>}
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
