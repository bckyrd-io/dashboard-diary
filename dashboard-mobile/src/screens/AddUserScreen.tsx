import React, { useEffect, useState } from 'react';
<<<<<<< Updated upstream
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Card, Input, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

interface Branch {
  id: number;
  name: string;
  location: string;
}
=======
import { Alert, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Input, ScreenHeader } from '../components/ui';

interface Branch { id: number; name: string; location: string; }
>>>>>>> Stashed changes

export default function AddUserScreen() {
  const navigation = useNavigation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

<<<<<<< Updated upstream
  useEffect(() => {
    api.get<{ branches: Branch[] }>('/api/branches')
      .then((result) => setBranches(result.branches ?? []))
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!username.trim() || !email.trim() || password.length < 4 || !branchId) {
      return Alert.alert('Validation', 'Complete all fields and select a branch.');
    }
=======
  useEffect(() => { api.get<{ branches: Branch[] }>('/api/branches').then((result) => setBranches(result.branches ?? [])).catch(() => {}); }, []);

  const submit = async () => {
    if (!username.trim() || !email.trim() || password.length < 4 || !branchId) return Alert.alert('Validation', 'Complete all fields and select a branch.');
>>>>>>> Stashed changes
    setLoading(true);
    try {
      const result = await api.post<{ message?: string }>('/api/users', { username, email, password, branchId });
      if (result.message?.startsWith('Error')) throw new Error(result.message);
      Alert.alert('Success', 'User created successfully.');
      navigation.goBack();
<<<<<<< Updated upstream
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
          <Button variant="ghost" style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={Theme.foreground} />
          </Button>
        }
      />
      <View style={styles.content}>
        <Card>
          <View style={styles.form}>
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
  backButton: {
    paddingHorizontal: 8,
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
=======
    } catch (err: any) { Alert.alert('Error', err.message ?? 'Could not create user.'); } finally { setLoading(false); }
  };

  return <SafeAreaView className="flex-1 bg-gray-50"><ScreenHeader title="Add New User" description="Create a staff account" action={<Button variant="ghost" className="px-2" onPress={() => navigation.goBack()}><ArrowLeft size={20} color="#111827" /></Button>} /><View className="mx-4 bg-white border border-gray-200 rounded-lg p-4"><Text className="text-sm font-semibold text-gray-700 mb-1">Branch</Text><View className="flex-row flex-wrap gap-2 mb-4">{branches.map((branch) => <TouchableOpacity key={branch.id} onPress={() => setBranchId(branch.id)} className={`px-3 py-2 rounded-md border ${branchId === branch.id ? 'bg-green-50 border-primary' : 'bg-white border-gray-300'}`}><View className="flex-row items-center">{branchId === branch.id ? <Check size={14} color="#33b76d" /> : null}<Text className={`text-sm ml-1 ${branchId === branch.id ? 'text-primary font-semibold' : 'text-gray-700'}`}>{branch.name}</Text></View></TouchableOpacity>)}</View><Text className="text-sm font-semibold text-gray-700 mb-1">Full name</Text><Input value={username} onChangeText={setUsername} placeholder="Full name" className="mb-4" /><Text className="text-sm font-semibold text-gray-700 mb-1">Email</Text><Input value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" className="mb-4" /><Text className="text-sm font-semibold text-gray-700 mb-1">Password</Text><Input value={password} onChangeText={setPassword} placeholder="At least 4 characters" secureTextEntry className="mb-5" /><Button loading={loading} onPress={submit}>{loading ? 'Creating...' : 'Create user'}</Button></View></SafeAreaView>;
}
>>>>>>> Stashed changes
