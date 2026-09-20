import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, EmptyState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

interface Resource {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  resourceType: string;
}

export default function ResourcesScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filtered, setFiltered] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchResources = async () => {
    try {
      const result = await api.get<{ resources: Resource[] }>('/api/resources');
      setResources(result.resources);
      setFiltered(result.resources);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load resources.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      resources.filter(
        (r) => r.name.toLowerCase().includes(q) || r.resourceType.toLowerCase().includes(q)
      )
    );
  }, [search, resources]);

  const onRefresh = () => { setRefreshing(true); fetchResources(); };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <ScreenHeader title="Resources" description="Farm inventory & supplies" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search resources..."
          placeholderTextColor={Theme.mutedForeground}
          style={styles.searchInput}
        />
      </View>

      {error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Card style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <Text style={{ color: Theme.destructive, textAlign: 'center' }}>{error}</Text>
          </Card>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <EmptyState message="No resources found" />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.resourceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resourceName}>{item.name}</Text>
                <Text style={styles.resourceType}>{item.resourceType}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.resourceQty}>{item.quantity}</Text>
                <Text style={styles.resourceUnit}>{item.unit}</Text>
              </View>
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
  loadingText: { color: Theme.mutedForeground, marginTop: 12 },
  searchInput: {
    borderWidth: 1, borderColor: Theme.border, borderRadius: Theme.radius,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Theme.background,
    color: Theme.foreground, fontSize: 14, marginBottom: 16,
  },
  resourceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resourceName: { fontWeight: '600', color: Theme.foreground, fontSize: 15 },
  resourceType: { color: Theme.mutedForeground, fontSize: 12, marginTop: 2 },
  resourceQty: { fontSize: 18, fontWeight: 'bold', color: Theme.primary },
  resourceUnit: { color: Theme.mutedForeground, fontSize: 12 },
});
