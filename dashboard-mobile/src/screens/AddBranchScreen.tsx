import React, { useState } from 'react';
<<<<<<< Updated upstream
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Card, Input, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
=======
import { Alert, SafeAreaView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Input, ScreenHeader } from '../components/ui';
>>>>>>> Stashed changes

export default function AddBranchScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !location.trim()) return Alert.alert('Validation', 'Name and location are required.');
    setLoading(true);
    try {
      const result = await api.post<{ success: boolean; message?: string }>('/api/branches', { name, location });
      if (!result.success) throw new Error(result.message ?? 'Could not create branch.');
      Alert.alert('Success', 'Branch created successfully.');
      navigation.goBack();
<<<<<<< Updated upstream
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create branch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="New Branch"
        description="Add a farm location"
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
              <Text style={styles.label}>Branch name</Text>
              <Input value={name} onChangeText={setName} placeholder="e.g. North Farm" />
            </View>
            <View>
              <Text style={styles.label}>Location</Text>
              <Input value={location} onChangeText={setLocation} placeholder="e.g. Lilongwe" />
            </View>
            <Button loading={loading} onPress={submit}>
              {loading ? 'Creating...' : 'Create branch'}
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
});
=======
    } catch (err: any) { Alert.alert('Error', err.message ?? 'Could not create branch.'); } finally { setLoading(false); }
  };

  return <SafeAreaView className="flex-1 bg-gray-50"><ScreenHeader title="New Branch" description="Add a farm location" action={<Button variant="ghost" className="px-2" onPress={() => navigation.goBack()}><ArrowLeft size={20} color="#111827" /></Button>} /><View className="mx-4 bg-white border border-gray-200 rounded-lg p-4"><Text className="text-sm font-semibold text-gray-700 mb-1">Branch name</Text><Input value={name} onChangeText={setName} placeholder="e.g. North Farm" className="mb-4" /><Text className="text-sm font-semibold text-gray-700 mb-1">Location</Text><Input value={location} onChangeText={setLocation} placeholder="e.g. Lilongwe" className="mb-5" /><Button loading={loading} onPress={submit}>{loading ? 'Creating...' : 'Create branch'}</Button></View></SafeAreaView>;
}
>>>>>>> Stashed changes
