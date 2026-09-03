import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
<<<<<<< Updated upstream
  ScrollView,
=======
  FlatList,
>>>>>>> Stashed changes
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TouchableOpacity,
<<<<<<< Updated upstream
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, Button, EmptyState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
=======
  ScrollView,
} from 'react-native';
import { api } from '../services/api';
import { Card, Button, EmptyState, ScreenHeader } from '../components/ui';
>>>>>>> Stashed changes

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
  extendedProps?: { description: string };
}

interface Notification {
  notificationMessage: string;
}

function EventCard({ event }: { event: CalendarEvent }) {
  const start = new Date(event.start);
  return (
<<<<<<< Updated upstream
    <Card style={styles.eventCard}>
      <View style={styles.eventRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{start.getDate()}</Text>
          <Text style={styles.dateMonth}>
            {start.toLocaleDateString('en', { month: 'short' })}
          </Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.end && (
            <Text style={styles.eventEndDate}>
=======
    <Card className="mb-3 border-l-4 border-primary">
      <View className="flex-row items-start">
        <View className="bg-primary-light rounded-lg px-3 py-2 mr-3 items-center min-w-[50px]">
          <Text className="text-primary font-bold text-lg">{start.getDate()}</Text>
          <Text className="text-primary text-xs">{start.toLocaleDateString('en', { month: 'short' })}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 text-sm leading-snug">{event.title}</Text>
          {event.end && (
            <Text className="text-gray-400 text-xs mt-1">
>>>>>>> Stashed changes
              Until: {new Date(event.end).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

export default function ScheduleScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [schedulesRes, dashRes] = await Promise.all([
        api.get<{ success: boolean; events: CalendarEvent[] }>('/api/schedules'),
        api.get<{ notifications: Notification[] }>('/api/dashboard'),
      ]);

      if (schedulesRes.success) {
<<<<<<< Updated upstream
        setEvents(
          schedulesRes.events.map((e) => ({
            ...e,
            title:
              e.title.length > 40 ? `${e.title.substring(0, 40)}...` : e.title,
          }))
        );
=======
        setEvents(schedulesRes.events.map((e) => ({
          ...e,
          title: e.title.length > 40 ? `${e.title.substring(0, 40)}...` : e.title,
        })));
>>>>>>> Stashed changes
      }

      const notifs = dashRes.notifications ?? [];
      setNotifications(notifs);
      if (notifs.length > 0) setShowNotifications(true);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

<<<<<<< Updated upstream
  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
=======
  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#33b76d" />
        <Text className="text-gray-500 mt-3">Loading schedule...</Text>
>>>>>>> Stashed changes
      </View>
    );
  }

<<<<<<< Updated upstream
  const grouped: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    const month = new Date(e.start).toLocaleDateString('en', {
      month: 'long',
      year: 'numeric',
    });
=======
  // Group events by month
  const grouped: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    const month = new Date(e.start).toLocaleDateString('en', { month: 'long', year: 'numeric' });
>>>>>>> Stashed changes
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(e);
  });

  const sections = Object.entries(grouped);

  return (
<<<<<<< Updated upstream
    <SafeAreaView style={styles.safeArea}>
      <Modal visible={showNotifications} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📣 Scheduled Notifications</Text>
            <ScrollView style={styles.modalScroll}>
              {notifications.map((n, i) => (
                <View key={i} style={styles.notificationRow}>
                  <Text style={styles.notificationArrow}>➞</Text>
                  <Text style={styles.notificationText}>
                    {n.notificationMessage}
                  </Text>
=======
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Notifications modal */}
      <Modal visible={showNotifications} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">📣 Scheduled Notifications</Text>
            <ScrollView className="max-h-64 mb-4">
              {notifications.map((n, i) => (
                <View key={i} className="flex-row items-start mb-3">
                  <Text className="text-primary mr-2 mt-0.5">➞</Text>
                  <Text className="text-gray-700 text-sm flex-1">{n.notificationMessage}</Text>
>>>>>>> Stashed changes
                </View>
              ))}
            </ScrollView>
            <Button onPress={() => setShowNotifications(false)}>Close</Button>
          </View>
        </View>
      </Modal>

<<<<<<< Updated upstream
      <View style={styles.headerContainer}>
        <ScreenHeader
          title="Schedule"
          description={`${events.length} upcoming events`}
          action={
            notifications.length > 0 ? (
              <TouchableOpacity
                onPress={() => setShowNotifications(true)}
                style={styles.notificationButton}
              >
                <Text style={styles.notificationCount}>
                  {notifications.length}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
=======
      <View className="pb-2">
        <ScreenHeader title="Schedule" description={`${events.length} upcoming events`} action={notifications.length > 0 ? <TouchableOpacity onPress={() => setShowNotifications(true)} className="bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200"><Text className="text-yellow-700 text-sm font-semibold">{notifications.length}</Text></TouchableOpacity> : null} />
      </View>

      {error ? (
        <View className="px-4 mb-2">
          <Card className="bg-red-50 border-red-200">
            <Text className="text-red-600 text-center">{error}</Text>
>>>>>>> Stashed changes
          </Card>
        </View>
      ) : null}

      <ScrollView
<<<<<<< Updated upstream
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
=======
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#33b76d" />}
        contentContainerClassName="px-4 pb-10"
>>>>>>> Stashed changes
      >
        {sections.length === 0 ? (
          <EmptyState message="No events scheduled" />
        ) : (
          sections.map(([month, evts]) => (
            <View key={month}>
<<<<<<< Updated upstream
              <Text style={styles.monthHeader}>{month}</Text>
              {evts.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
=======
              <Text className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-3 mt-4">
                {month}
              </Text>
              {evts.map((e) => <EventCard key={e.id} event={e} />)}
>>>>>>> Stashed changes
            </View>
          ))
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.gray50,
  },
  loadingText: {
    color: Theme.gray500,
    marginTop: 12,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  errorCard: {
    backgroundColor: Theme.errorLight,
    borderColor: '#fecaca',
  },
  errorText: {
    color: Theme.error,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  monthHeader: {
    fontWeight: 'bold',
    color: Theme.gray500,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 16,
  },
  eventCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Theme.primary,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateBadge: {
    backgroundColor: Theme.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 50,
  },
  dateDay: {
    color: Theme.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  dateMonth: {
    color: Theme.primary,
    fontSize: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontWeight: '600',
    color: Theme.gray900,
    fontSize: 14,
    lineHeight: 20,
  },
  eventEndDate: {
    color: Theme.gray400,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.gray900,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 256,
    marginBottom: 16,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationArrow: {
    color: Theme.primary,
    marginRight: 8,
    marginTop: 2,
  },
  notificationText: {
    color: Theme.gray700,
    fontSize: 14,
    flex: 1,
  },
  notificationButton: {
    backgroundColor: Theme.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  notificationCount: {
    color: Theme.warning,
    fontSize: 14,
    fontWeight: '600',
  },
});
=======
>>>>>>> Stashed changes
