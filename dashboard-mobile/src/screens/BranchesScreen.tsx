import React, { useEffect, useState } from 'react';
<<<<<<< Updated upstream
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
=======
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, Text, View } from 'react-native';
>>>>>>> Stashed changes
import { useNavigation } from '@react-navigation/native';
import { MapPin, Plus, Sprout } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Card, EmptyState, ErrorState, ScreenHeader } from '../components/ui';
<<<<<<< Updated upstream
import { Theme } from '../constants/Theme';

interface Branch {
  id: number;
  name: string;
  location: string;
  userCount: number;
}
=======

interface Branch { id: number; name: string; location: string; userCount: number; }
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader
        title="Branches"
        description={`${branches.length} farm locations`}
        action={
          <Button variant="default" onPress={() => navigation.navigate('AddBranch' as never)}>
            <View style={s.actionRow}>
              <Plus size={16} color={Theme.background} />
              <Text style={s.actionText}>New</Text>
            </View>
          </Button>
        }
      />
=======
  if (loading) return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator color="#33b76d" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Branches" description={`${branches.length} farm locations`} action={<Button className="px-3" onPress={() => navigation.navigate('AddBranch' as never)}><Plus size={16} color="#fff" /><Text className="text-white font-semibold ml-1">New</Text></Button>} />
>>>>>>> Stashed changes
      {error ? <ErrorState message={error} /> : null}
      <FlatList
        data={branches}
        keyExtractor={(item) => String(item.id)}
<<<<<<< Updated upstream
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBranches(); }}
            tintColor={Theme.primary}
          />
        }
        ListEmptyComponent={<EmptyState icon={Sprout} message="No branches available" />}
        renderItem={({ item }) => (
          <Card style={s.card}>
            <View style={s.cardRow}>
              <View style={s.iconContainer}>
                <MapPin size={19} color={Theme.primary} />
              </View>
              <View style={s.branchInfo}>
                <Text style={s.branchName}>{item.name}</Text>
                <Text style={s.branchLocation}>{item.location}</Text>
              </View>
              <Text style={s.staffCount}>{item.userCount} staff</Text>
=======
        contentContainerClassName="px-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBranches(); }} tintColor="#33b76d" />}
        ListEmptyComponent={<EmptyState icon={Sprout} message="No branches available" />}
        renderItem={({ item }) => (
          <Card className="mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-md bg-green-50 items-center justify-center"><MapPin size={19} color="#33b76d" /></View>
              <View className="flex-1 ml-3"><Text className="font-semibold text-gray-950 text-base">{item.name}</Text><Text className="text-gray-500 text-sm mt-1">{item.location}</Text></View>
              <Text className="text-gray-500 text-xs">{item.userCount} staff</Text>
>>>>>>> Stashed changes
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
<<<<<<< Updated upstream

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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: Theme.background,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  branchName: {
    fontWeight: '600',
    color: Theme.gray900,
    fontSize: 16,
  },
  branchLocation: {
    color: Theme.gray500,
    fontSize: 14,
    marginTop: 4,
  },
  staffCount: {
    color: Theme.gray500,
    fontSize: 12,
  },
});
=======
>>>>>>> Stashed changes
