import React, { useState } from 'react';
import { Alert, SafeAreaView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Input } from '../components/ui';
import { Theme } from '../constants/Theme';

export default function AddBranchScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !location.trim())
      return Alert.alert('Validation', 'Name and location are required.');
    setLoading(true);
    try {
      const result = await api.post<{ success: boolean; message?: string }>('/api/branches', {
        name,
        location,
      });
      if (!result.success) throw new Error(result.message ?? 'Could not create branch.');
      Alert.alert('Success', 'Branch created successfully.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create branch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>New Branch</Text>
          <Text style={styles.headerSub}>Add a farm location</Text>
        </View>
        <Button variant="ghost" style={{ paddingHorizontal: 8 }} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={Theme.foreground} />
        </Button>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Branch name</Text>
        <Input value={name} onChangeText={setName} placeholder="e.g. North Farm" style={{ marginBottom: 16 }} />
        <Text style={styles.label}>Location</Text>
        <Input value={location} onChangeText={setLocation} placeholder="e.g. Lilongwe" style={{ marginBottom: 20 }} />
        <Button loading={loading} onPress={submit}>
          {loading ? 'Creating...' : 'Create branch'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.foreground },
  headerSub: { fontSize: 13, color: Theme.mutedForeground, marginTop: 2 },
  form: {
    marginHorizontal: 16, backgroundColor: Theme.background,
    borderWidth: 1, borderColor: Theme.border, borderRadius: 12, padding: 16,
  },
  label: { fontSize: 13, fontWeight: '600', color: Theme.gray700, marginBottom: 6 },
});
