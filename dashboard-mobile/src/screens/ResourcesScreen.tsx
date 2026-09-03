import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
<<<<<<< Updated upstream
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, EmptyState, ScreenHeader, Input } from '../components/ui';
import { Theme } from '../constants/Theme';
=======
  TextInput,
} from 'react-native';
import { api } from '../services/api';
import { Card, EmptyState, ScreenHeader } from '../components/ui';
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      resources.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.resourceType.toLowerCase().includes(q)
      )
    );
  }, [search, resources]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResources();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading resources...</Text>
=======
  useEffect(() => { fetchResources(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(resources.filter(r => r.name.toLowerCase().includes(q) || r.resourceType.toLowerCase().includes(q)));
  }, [search, resources]);

  const onRefresh = () => { setRefreshing(true); fetchResources(); };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#33b76d" />
        <Text className="text-gray-500 mt-3">Loading resources...</Text>
>>>>>>> Stashed changes
      </View>
    );
  }

  return (
<<<<<<< Updated upstream
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSection}>
        <ScreenHeader
          title="Resources"
          description="Farm inventory & supplies"
        />
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search resources..."
=======
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4">
        <ScreenHeader title="Resources" description="Farm inventory & supplies" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search resources..."
          placeholderTextColor="#9ca3af"
          className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 mb-4 text-sm"
>>>>>>> Stashed changes
        />
      </View>

      {error ? (
<<<<<<< Updated upstream
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
=======
        <View className="px-4">
          <Card className="bg-red-50 border-red-200">
            <Text className="text-red-600 text-center">{error}</Text>
>>>>>>> Stashed changes
          </Card>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
<<<<<<< Updated upstream
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
=======
        contentContainerClassName="px-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#33b76d" />}
        ListEmptyComponent={
          <View className="items-center py-16">
>>>>>>> Stashed changes
            <EmptyState message="No resources found" />
          </View>
        }
        renderItem={({ item }) => (
<<<<<<< Updated upstream
          <Card style={styles.resourceCard}>
            <View style={styles.resourceRow}>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>{item.name}</Text>
                <Text style={styles.resourceType}>{item.resourceType}</Text>
              </View>
              <View style={styles.resourceQuantity}>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Text style={styles.unitText}>{item.unit}</Text>
=======
          <Card className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 text-base">{item.name}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{item.resourceType}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-primary">{item.quantity}</Text>
                <Text className="text-gray-400 text-xs">{item.unit}</Text>
>>>>>>> Stashed changes
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
<<<<<<< Updated upstream

const styles = StyleSheet.create({
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
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  errorContainer: {
    paddingHorizontal: 16,
  },
  errorCard: {
    backgroundColor: Theme.errorLight,
    borderColor: '#fecaca',
  },
  errorText: {
    color: Theme.error,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  resourceCard: {
    marginBottom: 12,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontWeight: '600',
    color: Theme.gray900,
    fontSize: 16,
  },
  resourceType: {
    color: Theme.gray400,
    fontSize: 12,
    marginTop: 2,
  },
  resourceQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.primary,
  },
  unitText: {
    color: Theme.gray400,
    fontSize: 12,
  },
});
=======
>>>>>>> Stashed changes
