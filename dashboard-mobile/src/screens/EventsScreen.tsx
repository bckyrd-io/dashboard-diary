import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCw, Package } from 'lucide-react-native';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';

interface Event {
  id: number;
  eventType: string;
  financialType: string;
  description: string;
  amount: number;
  date: string;
  branchId: number | null;
  toBranchId: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  createdAt: string;
}

const EVENT_TYPES = ['All', 'sale', 'transfer', 'receiving'];

export default function EventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('All');

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'All') {
        params.append('event_type', selectedType);
      }
      const queryString = params.toString();
      const url = `/api/events${queryString ? `?${queryString}` : ''}`;

      const result = await api.get<{ success: boolean; events: Event[] }>(url);
      if (result.success) {
        setEvents(result.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [selectedType])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'sale':
        return <DollarSign size={20} color={Theme.success} />;
      case 'transfer':
        return <ArrowUpRight size={20} color={Theme.primary} />;
      case 'receiving':
        return <ArrowDownLeft size={20} color={Theme.warning} />;
      default:
        return <Package size={20} color={Theme.gray500} />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'sale': return 'Sale';
      case 'transfer': return 'Transfer';
      case 'receiving': return 'Receiving';
      default: return eventType;
    }
  };

  const getPaymentBadge = (paymentStatus: string | null) => {
    if (!paymentStatus) return null;
    const color = paymentStatus === 'success' ? Theme.success
      : paymentStatus === 'failed' ? Theme.error
      : Theme.warning;
    return (
      <View style={[styles.paymentBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.paymentBadgeText, { color }]}>
          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </Text>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `MWK ${amount.toLocaleString()}`;
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => (navigation as any).navigate('EventDetail', { eventId: item.id })}
    >
      <View style={styles.eventIcon}>
        {getEventIcon(item.eventType)}
      </View>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventType}>{getEventLabel(item.eventType)}</Text>
          <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.eventDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.eventFooter}>
          {item.amount > 0 && (
            <Text style={[styles.eventAmount, item.eventType === 'sale' && styles.amountPositive]}>
              {item.eventType === 'expense' ? '-' : ''}{formatAmount(item.amount)}
            </Text>
          )}
          {getPaymentBadge(item.paymentStatus)}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Event Type Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={EVENT_TYPES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterContainer}
        renderItem={({ item: type }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedType === type && styles.filterChipActive,
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedType === type && styles.filterChipTextActive,
              ]}
            >
              {type === 'All' ? 'All' : getEventLabel(type)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={Theme.gray300} />
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius,
    backgroundColor: Theme.muted,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  filterChipActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.gray600,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: Theme.background,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 10,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius,
    backgroundColor: Theme.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: { flex: 1 },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventType: { fontSize: 14, fontWeight: '600', color: Theme.foreground, textTransform: 'capitalize' },
  eventDate: { fontSize: 12, color: Theme.gray500 },
  eventDescription: { fontSize: 13, color: Theme.gray600, marginBottom: 6 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventAmount: { fontSize: 14, fontWeight: '600', color: Theme.foreground },
  amountPositive: { color: Theme.success },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentBadgeText: { fontSize: 11, fontWeight: '600' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, color: Theme.gray500, marginTop: 12 },
});
