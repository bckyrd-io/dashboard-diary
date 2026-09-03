import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
<<<<<<< Updated upstream
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, Button } from '../components/ui';
import { Theme } from '../constants/Theme';
=======
} from 'react-native';
import { api } from '../services/api';
import { Card, Button, StatusBadge } from '../components/ui';
>>>>>>> Stashed changes

interface Activity {
  id: number;
  description: string;
}

type ActivityType = 'Revenue' | 'Expense' | 'Neutral';

const ACTIVITY_TYPES: ActivityType[] = ['Revenue', 'Expense', 'Neutral'];

<<<<<<< Updated upstream
const TYPE_STYLES: Record<ActivityType, { bg: string; border: string; text: string }> = {
  Revenue: { bg: Theme.successLight, border: Theme.success, text: Theme.success },
  Expense: { bg: Theme.errorLight, border: Theme.error, text: Theme.error },
  Neutral: { bg: Theme.gray100, border: Theme.gray300, text: Theme.gray700 },
};

=======
>>>>>>> Stashed changes
export default function ActivityScreen() {
  const [farmActivities, setFarmActivities] = useState<Activity[]>([]);
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('Neutral');
  const [amount, setAmount] = useState('');
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    api.get<{ success: boolean; activities: Activity[] }>('/api/activities')
      .then((result) => {
        if (result.success) setFarmActivities(result.activities);
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation', 'Description is required.');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Validation', 'Amount must be a positive number.');
      return;
    }
    if (!activityDate) {
      Alert.alert('Validation', 'Activity date is required.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{ success: boolean; message?: string }>('/api/activities', {
        description,
        activityType,
        amount: Number(amount),
        activityDate,
      });

      if (result.success) {
        Alert.alert('Success', 'Activity created successfully!');
        setDescription('');
        setAmount('');
        setActivityType('Neutral');
        setActivityDate(new Date().toISOString().split('T')[0]);
      } else {
        throw new Error(result.message ?? 'Failed to create activity.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< Updated upstream
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Log Activity</Text>
        <Text style={styles.subtitle}>Record a new farm activity</Text>

        <Card>
          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Description</Text>
              {fetching ? (
                <ActivityIndicator size="small" color={Theme.primary} style={{ marginVertical: 8 }} />
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setShowPicker(!showPicker)}
                    style={styles.pickerTrigger}
                  >
                    <Text style={description ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                      {description || 'Select or type a description'}
                    </Text>
                    <Text style={styles.pickerArrow}>▾</Text>
                  </TouchableOpacity>

                  {showPicker && (
                    <View style={styles.pickerDropdown}>
                      <ScrollView nestedScrollEnabled>
                        {farmActivities.map((act) => (
                          <TouchableOpacity
                            key={act.id}
                            onPress={() => { setDescription(act.description); setShowPicker(false); }}
                            style={styles.pickerItem}
                          >
                            {description === act.description && (
                              <Text style={styles.pickerCheck}>✓</Text>
                            )}
                            <Text style={styles.pickerItemText}>{act.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Or type a custom description..."
                    placeholderTextColor={Theme.gray400}
                    style={styles.input}
                  />
                </>
              )}
            </View>

            <View>
              <Text style={styles.label}>Activity Type</Text>
              <View style={styles.typeRow}>
                {ACTIVITY_TYPES.map((type) => {
                  const isActive = activityType === type;
                  const typeStyle = TYPE_STYLES[type];
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setActivityType(type)}
                      style={[
                        styles.typeButton,
                        isActive
                          ? { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }
                          : styles.typeButtonInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          isActive ? { color: typeStyle.text } : styles.typeButtonTextInactive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Theme.gray400}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>Activity Date</Text>
              <TextInput
                value={activityDate}
                onChangeText={setActivityDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Theme.gray400}
                style={styles.input}
              />
            </View>

            <View>
              <Button onPress={handleSubmit} loading={loading}>
                {loading ? 'Submitting...' : 'Add Activity'}
              </Button>
            </View>
=======
  const typeColors: Record<ActivityType, string> = {
    Revenue: 'bg-green-100 border-green-300',
    Expense: 'bg-red-100 border-red-300',
    Neutral: 'bg-gray-100 border-gray-300',
  };

  const typeTextColors: Record<ActivityType, string> = {
    Revenue: 'text-green-700',
    Expense: 'text-red-600',
    Neutral: 'text-gray-700',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 pb-10">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Log Activity</Text>
        <Text className="text-gray-400 text-sm mb-5">Record a new farm activity</Text>

        <Card className="mb-4">
          {/* Description */}
          <Text className="text-sm font-semibold text-gray-700 mb-1">Description</Text>
          {fetching ? (
            <ActivityIndicator size="small" color="#33b76d" className="my-2" />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowPicker(!showPicker)}
                className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 flex-row justify-between items-center mb-1"
              >
                <Text className={description ? 'text-gray-900 text-sm' : 'text-gray-400 text-sm'}>
                  {description || 'Select or type a description'}
                </Text>
                <Text className="text-gray-400">▾</Text>
              </TouchableOpacity>

              {showPicker && (
                <View className="border border-gray-100 rounded-xl bg-white mb-2 max-h-40">
                  <ScrollView nestedScrollEnabled>
                    {farmActivities.map((act) => (
                      <TouchableOpacity
                        key={act.id}
                        onPress={() => { setDescription(act.description); setShowPicker(false); }}
                        className="px-4 py-3 border-b border-gray-50 flex-row items-center"
                      >
                        {description === act.description && (
                          <Text className="text-primary mr-2 text-sm">✓</Text>
                        )}
                        <Text className="text-gray-700 text-sm">{act.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Or type a custom description..."
                placeholderTextColor="#9ca3af"
                className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 text-sm"
              />
            </>
          )}

          {/* Activity Type */}
          <Text className="text-sm font-semibold text-gray-700 mt-4 mb-2">Activity Type</Text>
          <View className="flex-row gap-2">
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setActivityType(type)}
                className={`flex-1 py-2 rounded-xl border items-center ${activityType === type ? typeColors[type] : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-sm font-semibold ${activityType === type ? typeTextColors[type] : 'text-gray-400'}`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text className="text-sm font-semibold text-gray-700 mt-4 mb-1">Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 text-sm"
          />

          {/* Activity Date */}
          <Text className="text-sm font-semibold text-gray-700 mt-4 mb-1">Activity Date</Text>
          <TextInput
            value={activityDate}
            onChangeText={setActivityDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 text-sm"
          />

          {/* Submit */}
          <View className="mt-5">
            <Button onPress={handleSubmit} loading={loading}>
              {loading ? 'Submitting...' : 'Add Activity'}
            </Button>
>>>>>>> Stashed changes
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
<<<<<<< Updated upstream

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.gray50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.gray900,
    marginBottom: 4,
  },
  subtitle: {
    color: Theme.gray400,
    fontSize: 14,
    marginBottom: 20,
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
  input: {
    borderWidth: 1,
    borderColor: Theme.gray300,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Theme.background,
    color: Theme.gray900,
    fontSize: 16,
  },
  pickerTrigger: {
    borderWidth: 1,
    borderColor: Theme.gray300,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Theme.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerTextSelected: {
    color: Theme.gray900,
    fontSize: 16,
  },
  pickerTextPlaceholder: {
    color: Theme.gray400,
    fontSize: 16,
  },
  pickerArrow: {
    color: Theme.gray400,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: Theme.gray200,
    borderRadius: 6,
    backgroundColor: Theme.background,
    marginBottom: 8,
    maxHeight: 160,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.gray50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerCheck: {
    color: Theme.primary,
    marginRight: 8,
    fontSize: 14,
  },
  pickerItemText: {
    color: Theme.gray700,
    fontSize: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonInactive: {
    backgroundColor: Theme.background,
    borderColor: Theme.gray300,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextInactive: {
    color: Theme.gray400,
  },
});
=======
>>>>>>> Stashed changes
