import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Calendar, DollarSign, CreditCard, Package, MapPin } from 'lucide-react-native';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';

interface EventItem {
  id: number;
  eventId: number;
  itemId: number;
  quantity: number;
  unitPriceAtSale: number;
  itemName: string;
  itemBarcode: string | null;
  itemImage: string | null;
}

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
  paymentReference: string | null;
  paymentStatus: string | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  createdAt: string;
  items: EventItem[];
}

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params as { eventId: number };

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const result = await api.get<{ success: boolean; event: Event }>(`/api/events/${eventId}`);
      if (result.success) {
        setEvent(result.event);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `MWK ${amount.toLocaleString()}`;
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'Sale';
      case 'transfer': return 'Stock Transfer';
      case 'receiving': return 'Stock Receiving';
      default: return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return Theme.success;
      case 'transfer': return Theme.primary;
      case 'receiving': return Theme.warning;
      default: return Theme.gray500;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={Theme.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(event.eventType) + '20' }]}>
          <Text style={[styles.typeBadgeText, { color: getEventTypeColor(event.eventType) }]}>
            {getEventTypeLabel(event.eventType)}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{event.description}</Text>

        {/* Amount */}
        {event.amount > 0 && (
          <View style={styles.amountCard}>
            <DollarSign size={24} color={Theme.primary} />
            <Text style={styles.amountText}>{formatAmount(event.amount)}</Text>
          </View>
        )}

        {/* Event Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Calendar size={18} color={Theme.gray500} />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(event.date)}</Text>
          </View>

          {event.paymentMethod && (
            <View style={styles.detailRow}>
              <CreditCard size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Payment</Text>
              <Text style={styles.detailValue}>
                {event.paymentMethod === 'nfc_tap'
                  ? 'NFC Card Tap'
                  : event.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          )}

          {event.paymentStatus && (
            <View style={styles.detailRow}>
              <DollarSign size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Status</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: event.paymentStatus === 'success' ? Theme.successLight
                  : event.paymentStatus === 'failed' ? Theme.errorLight
                  : Theme.warningLight
              }]}>
                <Text style={[styles.statusText, {
                  color: event.paymentStatus === 'success' ? Theme.success
                    : event.paymentStatus === 'failed' ? Theme.error
                    : Theme.warning
                }]}>
                  {event.paymentStatus.charAt(0).toUpperCase() + event.paymentStatus.slice(1)}
                </Text>
              </View>
            </View>
          )}

          {event.paymentReference && (
            <View style={styles.detailRow}>
              <Package size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={[styles.detailValue, styles.referenceText]}>{event.paymentReference}</Text>
            </View>
          )}
        </View>

        {/* Line Items */}
        {event.items && event.items.length > 0 && (
          <View style={styles.itemsCard}>
            <Text style={styles.sectionTitle}>Items ({event.items.length})</Text>
            {event.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemQty}>
                    {item.quantity} x {formatAmount(item.unitPriceAtSale)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatAmount(item.quantity * item.unitPriceAtSale)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Theme.gray500 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Theme.foreground },
  content: { padding: 16 },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadgeText: { fontSize: 13, fontWeight: '600' },
  description: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.foreground,
    marginBottom: 16,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primaryLight,
    padding: 20,
    borderRadius: Theme.radius,
    marginBottom: 16,
    gap: 12,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.primary,
  },
  detailsCard: {
    backgroundColor: Theme.background,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  detailLabel: { flex: 1, marginLeft: 12, fontSize: 14, color: Theme.gray500 },
  detailValue: { fontSize: 14, fontWeight: '500', color: Theme.foreground },
  referenceText: { fontSize: 12, fontFamily: 'monospace' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  itemsCard: {
    backgroundColor: Theme.background,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.foreground,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: Theme.foreground },
  itemQty: { fontSize: 12, color: Theme.gray500, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: Theme.foreground },
});
