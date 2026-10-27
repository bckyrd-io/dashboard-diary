import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Card, Input, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

interface Branch {
  id: number;
  name: string;
  location: string;
}

const ROLES = [
  { value: 'Staff', label: 'Staff' },
  { value: 'Cashier', label: 'Cashier' },
  { value: 'admin', label: 'Admin' },
];

export default function AddUserScreen() {
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopOrTablet = windowWidth >= 768;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(0);
  const [role, setRole] = useState('Staff');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ branches: Branch[] }>('/api/branches')
      .then((result) => setBranches(result.branches ?? []))
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!username.trim() || !email.trim() || password.length < 4 || !branchId) {
      return Alert.alert('Validation', 'Complete all fields and select a branch.');
    }
    setLoading(true);
    try {
      const result = await api.post<{ message?: string }>('/api/users', { username, email, password, branchId, role });
      if (result.message?.startsWith('Error')) throw new Error(result.message);
      Alert.alert('Success', 'User created successfully.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Add New User"
        back={() => navigation.goBack()}
      />
      <View style={[styles.content, { width: isDesktopOrTablet ? '70%' : undefined, alignSelf: isDesktopOrTablet ? 'center' : 'stretch' }]}>
        <Card>
          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Role</Text>
              <View style={styles.chipContainer}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    style={[
                      styles.chip,
                      role === r.value ? styles.chipSelected : styles.chipUnselected,
                    ]}
                  >
                    <View style={styles.chipRow}>
                      {role === r.value ? <Check size={14} color={Theme.primary} /> : null}
                      <Text style={[
                        styles.chipText,
                        role === r.value ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}>
                        {r.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.roleHint}>
                Admins see all business data; staff and cashiers only see their own activity.
              </Text>
            </View>

            <View>
              <Text style={styles.label}>Branch</Text>
              <View style={styles.chipContainer}>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    onPress={() => setBranchId(branch.id)}
                    style={[
                      styles.chip,
                      branchId === branch.id ? styles.chipSelected : styles.chipUnselected,
                    ]}
                  >
                    <View style={styles.chipRow}>
                      {branchId === branch.id ? <Check size={14} color={Theme.primary} /> : null}
                      <Text style={[
                        styles.chipText,
                        branchId === branch.id ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}>
                        {branch.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={styles.label}>Full name</Text>
              <Input value={username} onChangeText={setUsername} placeholder="Full name" />
            </View>

            <View>
              <Text style={styles.label}>Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="At least 4 characters"
                secureTextEntry
              />
            </View>

            <Button loading={loading} onPress={submit}>
              {loading ? 'Creating...' : 'Create user'}
            </Button>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.gray50,
  },
  content: {
    marginHorizontal: 16,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.gray700,
    marginBottom: 4,
  },
  roleHint: {
    fontSize: 11,
    color: Theme.gray500,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Theme.primaryLight,
    borderColor: Theme.primary,
  },
  chipUnselected: {
    backgroundColor: Theme.background,
    borderColor: Theme.gray300,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    marginLeft: 4,
  },
  chipTextSelected: {
    color: Theme.primary,
    fontWeight: '600',
  },
  chipTextUnselected: {
    color: Theme.gray700,
  },
});
