import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="User Management"
        action={
          <Button
            style={{ paddingHorizontal: 12 }}
            onPress={() => navigation.navigate('AddUser' as never)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UserPlus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>Add</Text>
            </View>
          </Button>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchUsers(); }}
            tintColor={Theme.primary}
          />
        }
        ListEmptyComponent={<EmptyState icon={UsersIcon} message="No users found" />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{item.username}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Mail size={13} color={Theme.mutedForeground} />
                  <Text style={styles.userEmail}>{item.email}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.muted },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: Theme.radius, backgroundColor: Theme.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Theme.gray700, fontWeight: 'bold', fontSize: 16 },
  userName: { fontWeight: '600', color: Theme.gray900 },
  userEmail: { color: Theme.mutedForeground, fontSize: 12, marginLeft: 4 },
});
