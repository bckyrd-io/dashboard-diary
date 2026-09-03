import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { api } from '../services/api';
import { Card, Button, EmptyState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';

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
        setEvents(
          schedulesRes.events.map((e) => ({
            ...e,
            title:
              e.title.length > 40 ? `${e.title.substring(0, 40)}...` : e.title,
          }))
        );
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
      </View>
    );
  }

  const grouped: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    const month = new Date(e.start).toLocaleDateString('en', {
      month: 'long',
      year: 'numeric',
    });
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(e);
  });

  const sections = Object.entries(grouped);

  return (
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
                </View>
              ))}
            </ScrollView>
            <Button onPress={() => setShowNotifications(false)}>Close</Button>
          </View>
        </View>
      </Modal>

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
          </Card>
        </View>
      ) : null}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {sections.length === 0 ? (
          <EmptyState message="No events scheduled" />
        ) : (
          sections.map(([month, evts]) => (
            <View key={month}>
              <Text style={styles.monthHeader}>{month}</Text>
              {evts.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
