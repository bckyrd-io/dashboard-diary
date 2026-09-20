import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { api } from '../services/api';
import { Card, EmptyState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
import { sendLocalNotification } from '../services/notifications';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
}

interface Notification {
  notificationMessage: string;
}

export default function ScheduleScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
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
            title: e.title.length > 40 ? `${e.title.substring(0, 40)}...` : e.title,
          }))
        );
      }
      const notifs = dashRes.notifications ?? [];
      setNotifications(notifs);

      // Trigger local device notifications for new schedule alerts instead of a blocking modal
      if (notifs.length > 0) {
        const topNotif = notifs[0];
        sendLocalNotification(
          'Scheduled Reminder',
          topNotif.notificationMessage,
          { count: notifs.length }
        );
      }
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Build marked dates from events
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    events.forEach((e) => {
      const dateStr = e.start.split('T')[0];
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [], marked: true };
      }
      marks[dateStr].dots.push({ key: e.id, color: Theme.primary });
    });

    // Mark selected date
    if (selectedDate) {
      if (marks[selectedDate]) {
        marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: Theme.primary };
      } else {
        marks[selectedDate] = { selected: true, selectedColor: Theme.primary };
      }
    }

    return marks;
  }, [events, selectedDate]);

  // Events for selected date
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => e.start.startsWith(selectedDate));
  }, [events, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingBottom: 4 }}>
        <ScreenHeader
          title="Schedule"
          description={`${events.length} upcoming events`}
        />
      </View>

      {error ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Card style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <Text style={{ color: Theme.destructive, textAlign: 'center' }}>{error}</Text>
          </Card>
        </View>
      ) : null}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Calendar */}
        <Calendar
          markedDates={markedDates}
          onDayPress={onDayPress}
          theme={{
            backgroundColor: Theme.background,
            calendarBackground: Theme.background,
            textSectionTitleColor: Theme.mutedForeground,
            selectedDayBackgroundColor: Theme.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: Theme.primary,
            dayTextColor: Theme.foreground,
            textDisabledColor: Theme.gray300,
            dotColor: Theme.primary,
            selectedDotColor: '#ffffff',
            arrowColor: Theme.primary,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 15,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
          markingType="multi-dot"
        />

        {/* Events for selected date */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>
            {selectedDate
              ? `Events on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : 'Select a date to view events'}
          </Text>

          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.eventRow}>
                  <View style={styles.eventDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>
                      {new Date(event.start).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : selectedDate ? (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: Theme.mutedForeground }}>No events on this date</Text>
            </Card>
          ) : (
            <EmptyState message="Tap a date on the calendar to see scheduled events" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.muted },
  loadingText: { color: Theme.mutedForeground, marginTop: 12 },
  eventsSection: { paddingHorizontal: 16, paddingTop: 16 },
  eventsTitle: { fontSize: 15, fontWeight: '600', color: Theme.gray700, marginBottom: 12 },
  eventCard: { marginBottom: 8 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.primary, marginRight: 12,
  },
  eventTitle: { fontWeight: '600', color: Theme.foreground, fontSize: 14 },
  eventTime: { color: Theme.mutedForeground, fontSize: 12, marginTop: 2 },
});
