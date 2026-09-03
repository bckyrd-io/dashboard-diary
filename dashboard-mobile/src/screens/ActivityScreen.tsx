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
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, Button, StatusBadge } from '../components/ui';
import { Theme } from '../constants/Theme';

interface Activity {
  id: number;
  description: string;
}

type ActivityType = 'Revenue' | 'Expense' | 'Neutral';
const ACTIVITY_TYPES: ActivityType[] = ['Revenue', 'Expense', 'Neutral'];

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
    api
      .get<{ success: boolean; activities: Activity[] }>('/api/activities')
      .then((result) => {
        if (result.success) setFarmActivities(result.activities);
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async () => {
    if (!description.trim()) return Alert.alert('Validation', 'Description is required.');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return Alert.alert('Validation', 'Amount must be a positive number.');
    if (!activityDate) return Alert.alert('Validation', 'Activity date is required.');

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

  const typeColors: Record<ActivityType, { bg: string; border: string; text: string }> = {
    Revenue: { bg: Theme.successLight, border: '#86efac', text: Theme.success },
    Expense: { bg: Theme.errorLight, border: '#fca5a5', text: Theme.destructive },
    Neutral: { bg: Theme.gray100, border: Theme.border, text: Theme.gray700 },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 }}
      >
        <Text style={styles.title}>Log Activity</Text>
        <Text style={styles.subtitle}>Record a new farm activity</Text>

        <Card style={{ marginBottom: 16 }}>
          {/* Description */}
          <Text style={styles.label}>Description</Text>
          {fetching ? (
            <ActivityIndicator size="small" color={Theme.primary} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowPicker(!showPicker)}
                style={styles.pickerToggle}
              >
                <Text style={description ? styles.pickerText : styles.pickerPlaceholder}>
                  {description || 'Select or type a description'}
                </Text>
                <Text style={{ color: Theme.mutedForeground }}>▾</Text>
              </TouchableOpacity>

              {showPicker && (
                <View style={styles.pickerList}>
                  <ScrollView nestedScrollEnabled>
                    {farmActivities.map((act) => (
                      <TouchableOpacity
                        key={act.id}
                        onPress={() => {
                          setDescription(act.description);
                          setShowPicker(false);
                        }}
                        style={styles.pickerItem}
                      >
                        {description === act.description && (
                          <Text style={{ color: Theme.primary, marginRight: 8, fontSize: 13 }}>✓</Text>
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
                placeholderTextColor={Theme.mutedForeground}
                style={styles.input}
              />
            </>
          )}

          {/* Activity Type */}
          <Text style={[styles.label, { marginTop: 16 }]}>Activity Type</Text>
          <View style={styles.typeRow}>
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setActivityType(type)}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: activityType === type ? typeColors[type].bg : Theme.background,
                    borderColor: activityType === type ? typeColors[type].border : Theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: activityType === type ? typeColors[type].text : Theme.mutedForeground,
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text style={[styles.label, { marginTop: 16 }]}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={Theme.mutedForeground}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Activity Date */}
          <Text style={[styles.label, { marginTop: 16 }]}>Activity Date</Text>
          <TextInput
            value={activityDate}
            onChangeText={setActivityDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Theme.mutedForeground}
            style={styles.input}
          />

          {/* Submit */}
          <View style={{ marginTop: 20 }}>
            <Button onPress={handleSubmit} loading={loading}>
              {loading ? 'Submitting...' : 'Add Activity'}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: Theme.foreground, marginBottom: 4 },
  subtitle: { color: Theme.mutedForeground, fontSize: 13, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Theme.gray700, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Theme.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Theme.muted,
    color: Theme.foreground, fontSize: 14,
  },
  pickerToggle: {
    borderWidth: 1, borderColor: Theme.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Theme.muted,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  pickerText: { color: Theme.foreground, fontSize: 14 },
  pickerPlaceholder: { color: Theme.mutedForeground, fontSize: 14 },
  pickerList: {
    borderWidth: 1, borderColor: Theme.border, borderRadius: 12,
    backgroundColor: Theme.background, marginBottom: 8, maxHeight: 160,
  },
  pickerItem: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    flexDirection: 'row', alignItems: 'center',
  },
  pickerItemText: { color: Theme.gray700, fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
});
