import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Input, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

interface Branch {
  id: number;
  name: string;
  location: string;
}

export default function AddUserScreen() {
  const navigation = useNavigation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ branches: Branch[] }>('/api/branches')
      .then((result) => setBranches(result.branches ?? []))
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!username.trim() || !email.trim() || password.length < 4 || !branchId)
      return Alert.alert('Validation', 'Complete all fields and select a branch.');
    setLoading(true);
    try {
      const result = await api.post<{ message?: string }>('/api/users', {
        username,
        email,
        password,
        branchId,
      });
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
        description="Create a staff account"
        action={
          <Button variant="ghost" style={{ paddingHorizontal: 8 }} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={Theme.foreground} />
          </Button>
        }
      />
      <View style={styles.form}>
        <Text style={styles.label}>Branch</Text>
        <View style={styles.branchRow}>
          {branches.map((branch) => (
            <TouchableOpacity
              key={branch.id}
              onPress={() => setBranchId(branch.id)}
              style={[
                styles.branchChip,
                branchId === branch.id && styles.branchChipActive,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {branchId === branch.id ? <Check size={14} color={Theme.primary} /> : null}
                <Text
                  style={[
                    styles.branchChipText,
                    branchId === branch.id && styles.branchChipTextActive,
                  ]}
                >
                  {branch.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Full name</Text>
        <Input value={username} onChangeText={setUsername} placeholder="Full name" style={{ marginBottom: 16 }} />

        <Text style={styles.label}>Email</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: 16 }}
        />

        <Text style={styles.label}>Password</Text>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="At least 4 characters"
          secureTextEntry
          style={{ marginBottom: 20 }}
        />

        <Button loading={loading} onPress={submit}>
          {loading ? 'Creating...' : 'Create user'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  form: {
    marginHorizontal: 16, backgroundColor: Theme.background,
    borderWidth: 1, borderColor: Theme.border, borderRadius: 12, padding: 16,
  },
  label: { fontSize: 13, fontWeight: '600', color: Theme.gray700, marginBottom: 6 },
  branchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  branchChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Theme.border, backgroundColor: Theme.background,
  },
  branchChipActive: { backgroundColor: Theme.successLight, borderColor: Theme.primary },
  branchChipText: { fontSize: 13, color: Theme.gray700, marginLeft: 4 },
  branchChipTextActive: { color: Theme.primary, fontWeight: '600' },
});
