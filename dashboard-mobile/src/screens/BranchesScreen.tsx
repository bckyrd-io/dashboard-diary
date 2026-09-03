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
      {error ? <ErrorState message={error} /> : null}
      <FlatList
        data={branches}
        keyExtractor={(item) => String(item.id)}
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
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

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
