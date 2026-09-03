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
import { Mail, UserPlus, Users as UsersIcon } from 'lucide-react-native';
import { api } from '../services/api';
import { Badge, Button, Card, EmptyState, ErrorState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

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
      {error ? <ErrorState message={error} /> : null}
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
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
              <Badge label={item.role} variant="outline" />
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
