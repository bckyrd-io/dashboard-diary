import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Plus, Sprout } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Card, EmptyState, ErrorState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

interface Branch {
  id: number;
  name: string;
  location: string;
  userCount: number;
}

export default function BranchesScreen() {
  const navigation = useNavigation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBranches = async () => {
    try {
      const result = await api.get<{ branches: Branch[] }>('/api/branches');
      setBranches(result.branches ?? []);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load branches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Branches"
        description={`${branches.length} farm locations`}
        action={
          <Button
            style={{ paddingHorizontal: 12 }}
            onPress={() => navigation.navigate('AddBranch' as never)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>New</Text>
            </View>
          </Button>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      <FlatList
        data={branches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBranches(); }}
            tintColor={Theme.primary}
          />
        }
        ListEmptyComponent={<EmptyState icon={Sprout} message="No branches available" />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.branchRow}>
              <View style={styles.branchIcon}>
                <MapPin size={19} color={Theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.branchName}>{item.name}</Text>
                <Text style={styles.branchLocation}>{item.location}</Text>
              </View>
              <Text style={styles.branchCount}>{item.userCount} staff</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.muted },
  branchRow: { flexDirection: 'row', alignItems: 'center' },
  branchIcon: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: Theme.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  branchName: { fontWeight: '600', color: Theme.gray900, fontSize: 15 },
  branchLocation: { color: Theme.mutedForeground, fontSize: 13, marginTop: 2 },
  branchCount: { color: Theme.mutedForeground, fontSize: 12 },
});
