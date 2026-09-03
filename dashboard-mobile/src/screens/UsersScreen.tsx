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
import { Mail, UserPlus, Users as UsersIcon } from 'lucide-react-native';
import { api } from '../services/api';
import { Badge, Button, Card, EmptyState, ErrorState, ScreenHeader } from '../components/ui';
<<<<<<< Updated upstream
import { Theme } from '../constants/Theme';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}
=======

interface User { id: number; username: string; email: string; role: string; createdAt: string; }
>>>>>>> Stashed changes

export default function UsersScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const result = await api.get<{ users: User[] }>('/api/users');
      setUsers(result.users ?? []);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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
        title="User Management"
        description={`${users.length} team members`}
        action={
          <Button variant="default" onPress={() => navigation.navigate('AddUser' as never)}>
            <View style={s.actionRow}>
              <UserPlus size={16} color={Theme.background} />
              <Text style={s.actionText}>Add</Text>
            </View>
          </Button>
        }
      />
=======
  if (loading) return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator color="#33b76d" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="User Management" description={`${users.length} team members`} action={<Button className="px-3" onPress={() => navigation.navigate('AddUser' as never)}><UserPlus size={16} color="#fff" /><Text className="text-white font-semibold ml-1">Add</Text></Button>} />
>>>>>>> Stashed changes
      {error ? <ErrorState message={error} /> : null}
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
<<<<<<< Updated upstream
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchUsers(); }}
            tintColor={Theme.primary}
          />
        }
        ListEmptyComponent={<EmptyState icon={UsersIcon} message="No users found" />}
        renderItem={({ item }) => (
          <Card style={s.card}>
            <View style={s.cardRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={s.userInfo}>
                <Text style={s.username}>{item.username}</Text>
                <View style={s.emailRow}>
                  <Mail size={13} color={Theme.gray500} />
                  <Text style={s.emailText}>{item.email}</Text>
                </View>
              </View>
=======
        contentContainerClassName="px-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#33b76d" />}
        ListEmptyComponent={<EmptyState icon={UsersIcon} message="No users found" />}
        renderItem={({ item }) => (
          <Card className="mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"><Text className="text-gray-700 font-bold">{item.username.charAt(0).toUpperCase()}</Text></View>
              <View className="flex-1 ml-3"><Text className="font-semibold text-gray-950">{item.username}</Text><View className="flex-row items-center mt-1"><Mail size={13} color="#6b7280" /><Text className="text-gray-500 text-xs ml-1">{item.email}</Text></View></View>
>>>>>>> Stashed changes
              <Badge label={item.role} variant="outline" />
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Theme.gray700,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontWeight: '600',
    color: Theme.gray900,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emailText: {
    color: Theme.gray500,
    fontSize: 12,
    marginLeft: 4,
  },
});
=======
>>>>>>> Stashed changes
