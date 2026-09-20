import React, { useState, useCallback } from 'react';
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
import { Calendar, DollarSign, CreditCard, CheckCircle, XCircle, Clock, Radio } from 'lucide-react-native';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';

interface SaleEvent {
  id: number;
  eventType: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  createdAt: string;
}

export default function PastCheckoutsScreen() {
  const navigation = useNavigation();
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSales = async () => {
    try {
      const result = await api.get<{ success: boolean; events: SaleEvent[] }>(
        '/api/events?event_type=sale'
      );
      if (result.success) {
        setSales(result.events);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => `MWK ${amount.toLocaleString()}`;

  const getPaymentIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} color={Theme.success} />;
      case 'failed':
        return <XCircle size={16} color={Theme.error} />;
      default:
        return <Clock size={16} color={Theme.warning} />;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'nfc_tap': return 'NFC Card Tap';
      case 'airtel_money': return 'Airtel Money';
      case 'tnm_mpamba': return 'TNM Mpamba';
      default: return method || 'N/A';
    }
  };

  const renderSale = ({ item }: { item: SaleEvent }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => (navigation as any).navigate('EventDetail', { eventId: item.id })}
    >
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <Text style={styles.saleDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.saleDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.saleAmount}>{formatAmount(item.amount)}</Text>
      </View>
      <View style={styles.saleFooter}>
        <View style={styles.paymentInfo}>
          {item.paymentMethod === 'nfc_tap' ? (
            <Radio size={14} color={Theme.primary} />
          ) : (
            <CreditCard size={14} color={Theme.gray500} />
          )}
          <Text style={[styles.paymentMethod, item.paymentMethod === 'nfc_tap' && { color: Theme.primary, fontWeight: '600' }]}>
            {getPaymentMethodLabel(item.paymentMethod)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {getPaymentIcon(item.paymentStatus)}
          <Text
            style={[
              styles.statusText,
              item.paymentStatus === 'success' && styles.statusSuccess,
              item.paymentStatus === 'failed' && styles.statusFailed,
              item.paymentStatus === 'pending' && styles.statusPending,
            ]}
          >
            {item.paymentStatus?.charAt(0).toUpperCase() + (item.paymentStatus?.slice(1) || '')}
          </Text>
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

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Sales ({sales.length})</Text>
        <Text style={styles.summaryAmount}>{formatAmount(totalSales)}</Text>
      </View>

      {/* Sales List */}
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSale}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <DollarSign size={48} color={Theme.gray300} />
            <Text style={styles.emptyText}>No sales yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: {
    padding: 16,
    backgroundColor: Theme.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  summaryLabel: { fontSize: 13, color: Theme.primary, marginBottom: 4 },
  summaryAmount: { fontSize: 24, fontWeight: '700', color: Theme.primary },
  listContent: { padding: 16 },
  saleCard: {
    padding: 14,
    backgroundColor: Theme.background,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 10,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  saleInfo: { flex: 1, marginRight: 12 },
  saleDescription: { fontSize: 14, fontWeight: '600', color: Theme.foreground, marginBottom: 4 },
  saleDate: { fontSize: 12, color: Theme.gray500 },
  saleAmount: { fontSize: 16, fontWeight: '700', color: Theme.primary },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentMethod: { fontSize: 12, color: Theme.gray500 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  statusSuccess: { color: Theme.success },
  statusFailed: { color: Theme.error },
  statusPending: { color: Theme.warning },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, color: Theme.gray500, marginTop: 12 },
});
