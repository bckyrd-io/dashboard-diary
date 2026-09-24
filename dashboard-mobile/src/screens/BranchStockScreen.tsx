import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  Check,
  Circle,
  Plus,
  Minus,
} from 'lucide-react-native';
import { api } from '../services/api';
import { Card, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
import { useTransfer } from '../context/TransferContext';
import { confirmDialog } from '../utils/confirm';

interface Item {
  id: number;
  name: string;
  category: string;
  subCategory: string | null;
  barcode: string | null;
  sku: string | null;
  price: number;
  quantity: number;
  reorderThreshold: number | null;
  imageUrl: string | null;
  branchId: number | null;
}

interface Branch {
  id: number;
  name: string;
  location: string;
}

interface TransferEvent {
  id: number;
  eventType: string;
  description: string;
  amount: number;
  date: string;
  branchId: number | null;
  toBranchId: number | null;
  createdAt: string;
}

export default function BranchStockScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as {
    branchId: number;
    branchName?: string;
    location?: string;
  }) || { branchId: 1, branchName: 'Branch', location: '' };

  const branchId = Number(params.branchId);
  const branchName = params.branchName || `Branch #${branchId}`;

  const [items, setItems] = useState<Item[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    items: transferItems,
    sourceBranchId,
    sourceBranchName,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    setSourceBranch,
    clearTransfer,
  } = useTransfer();

  const isCurrentSource = sourceBranchId !== null && Number(sourceBranchId) === branchId;

  const fetchData = async () => {
    try {
      const [itemsRes, branchesRes, eventsRes] = await Promise.all([
        api.get<{ success: boolean; items: Item[] }>(`/api/items?branch_id=${branchId}`),
        api.get<{ branches: Branch[] }>('/api/branches'),
        api.get<{ success: boolean; events: TransferEvent[] }>(
          `/api/events?event_type=transfer&branch_id=${branchId}`
        ),
      ]);

      if (itemsRes.success) {
        setItems(itemsRes.items);
      }
      if (branchesRes.branches) {
        setAllBranches(branchesRes.branches);
      }
      if (eventsRes.success) {
        setTransfers(eventsRes.events);
      }
    } catch (err: any) {
      console.error('Error loading branch stock data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [branchId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getItemTransferQuantity = (itemId: number) => {
    if (!isCurrentSource) return 0;
    const found = transferItems.find((i) => i.itemId === itemId);
    return found ? found.quantity : 0;
  };

  const handleToggleItem = (item: Item) => {
    if (item.quantity <= 0) {
      return;
    }

    // If transfer contains items from another branch
    if (sourceBranchId !== null && !isCurrentSource && transferItems.length > 0) {
      const proceedSwitch = () => {
        clearTransfer();
        setSourceBranch(branchId, branchName);
        addItem({
          itemId: item.id,
          name: item.name,
          price: item.price,
          maxQuantity: item.quantity,
          category: item.category,
          subCategory: item.subCategory,
        }, 1);
      };

      confirmDialog(
        'Switch Source Branch',
        `You currently have items selected from ${sourceBranchName}. Clear them and start transferring from ${branchName}?`,
        proceedSwitch,
        'Switch',
        'Cancel'
      );
      return;
    }

    if (!isCurrentSource) {
      setSourceBranch(branchId, branchName);
    }

    const currentQty = getItemTransferQuantity(item.id);
    if (currentQty > 0) {
      removeItem(item.id);
    } else {
      addItem({
        itemId: item.id,
        name: item.name,
        price: item.price,
        maxQuantity: item.quantity,
        category: item.category,
        subCategory: item.subCategory,
      }, 1);
    }
  };

  const handleIncrement = (item: Item) => {
    const currentQty = getItemTransferQuantity(item.id);
    if (currentQty < item.quantity) {
      updateQuantity(item.id, currentQty + 1);
    }
  };

  const handleDecrement = (item: Item) => {
    const currentQty = getItemTransferQuantity(item.id);
    if (currentQty > 1) {
      updateQuantity(item.id, currentQty - 1);
    } else {
      removeItem(item.id);
    }
  };

  const getStockBadge = (item: Item) => {
    if (item.quantity === 0) {
      return { text: 'Out of Stock', bg: '#fee2e2', color: '#dc2626' };
    }
    if (item.reorderThreshold && item.quantity <= item.reorderThreshold) {
      return { text: `Low (${item.quantity})`, bg: '#fef3c7', color: '#b45309' };
    }
    return { text: `${item.quantity} in stock`, bg: '#dcfce7', color: '#16a34a' };
  };

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  const currentSelectedCount = isCurrentSource ? transferItems.length : 0;
  const currentTotalQuantity = isCurrentSource ? itemCount : 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={branchName}
        description="Select items to transfer to another branch"
        back={() => navigation.goBack()}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.primary]} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>
              {items.length} item{items.length === 1 ? '' : 's'} in stock
              {currentSelectedCount > 0 ? ` • ${currentSelectedCount} selected (${currentTotalQuantity} units)` : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStockBadge(item);
          const transferQty = getItemTransferQuantity(item.id);
          const isSelected = transferQty > 0;
          const isOutOfStock = item.quantity <= 0;

          return (
            <TouchableOpacity
              activeOpacity={isOutOfStock ? 1 : 0.7}
              onPress={() => handleToggleItem(item)}
              disabled={isOutOfStock}
            >
              <Card style={[styles.itemCard, isSelected && styles.itemCardSelected, isOutOfStock && styles.itemCardDisabled]}>
                <View style={styles.itemRow}>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked,
                      isOutOfStock && styles.checkboxDisabled,
                    ]}
                  >
                    {isSelected ? (
                      <Check size={14} color="#fff" />
                    ) : (
                      <Circle size={14} color={isOutOfStock ? Theme.gray200 : Theme.gray300} />
                    )}
                  </View>

                  <View style={[styles.itemIcon, isSelected && { backgroundColor: Theme.primary }]}>
                    <Package size={20} color={isSelected ? '#fff' : Theme.primary} />
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, isOutOfStock && { color: Theme.gray400 }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSub}>{item.subCategory || item.category}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.qtyControlRow}>
                    <Text style={styles.qtyLabel}>Quantity to move:</Text>
                    <View style={styles.qtyButtons}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleDecrement(item);
                        }}
                      >
                        <Minus size={14} color={Theme.foreground} />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{transferQty}</Text>
                      <TouchableOpacity
                        style={[styles.qtyBtn, transferQty >= item.quantity && styles.qtyBtnDisabled]}
                        disabled={transferQty >= item.quantity}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleIncrement(item);
                        }}
                      >
                        <Plus size={14} color={transferQty >= item.quantity ? Theme.gray300 : Theme.foreground} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.qtyMax}>max {item.quantity}</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={44} color={Theme.gray300} />
            <Text style={styles.emptyText}>No items found in this branch</Text>
          </View>
        }
        ListFooterComponent={
          transfers.length > 0 ? (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Transfer History</Text>
              <Text style={styles.sectionSubtitle}>Recent stock movements involving this branch</Text>

              {transfers.slice(0, 10).map((t) => {
                const isOutgoing = t.branchId === branchId;
                const dest = allBranches.find((b) => b.id === t.toBranchId);
                const src = allBranches.find((b) => b.id === t.branchId);

                return (
                  <Card key={t.id} style={styles.transferCard}>
                    <View style={styles.transferRow}>
                      <View
                        style={[
                          styles.transferIconCircle,
                          { backgroundColor: isOutgoing ? '#fee2e2' : '#dcfce7' },
                        ]}
                      >
                        {isOutgoing ? (
                          <ArrowUpRight size={16} color="#dc2626" />
                        ) : (
                          <ArrowDownLeft size={16} color="#16a34a" />
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.transferDesc} numberOfLines={1}>
                          {t.description}
                        </Text>
                        <Text style={styles.transferMeta}>
                          {isOutgoing
                            ? `To: ${dest?.name ?? 'Branch #' + t.toBranchId}`
                            : `From: ${src?.name ?? 'Branch #' + t.branchId}`}
                          {' • '}
                          {new Date(t.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.transferTag,
                          { backgroundColor: isOutgoing ? '#fee2e2' : '#dcfce7' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.transferTagText,
                            { color: isOutgoing ? '#dc2626' : '#16a34a' },
                          ]}
                        >
                          {isOutgoing ? 'OUT' : 'IN'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: { marginTop: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Theme.foreground },
  sectionSubtitle: { fontSize: 12, color: Theme.mutedForeground, marginTop: 2 },
  itemCard: { marginBottom: 8, padding: 12 },
  itemCardSelected: { borderColor: Theme.primary, borderWidth: 1.5, backgroundColor: Theme.primaryLight },
  itemCardDisabled: { opacity: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Theme.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  checkboxDisabled: {
    borderColor: Theme.gray200,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: Theme.radius,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Theme.foreground },
  itemSub: { fontSize: 12, color: Theme.mutedForeground, marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: Theme.primary, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  qtyLabel: { fontSize: 12, color: Theme.gray700, fontWeight: '500', marginRight: 10 },
  qtyButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtnDisabled: {
    opacity: 0.3,
  },
  qtyValue: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
    color: Theme.foreground,
  },
  qtyMax: {
    fontSize: 11,
    color: Theme.mutedForeground,
    marginLeft: 8,
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: Theme.mutedForeground, marginTop: 8 },
  historySection: { marginTop: 24, marginBottom: 12 },
  transferCard: { marginBottom: 8, padding: 10 },
  transferRow: { flexDirection: 'row', alignItems: 'center' },
  transferIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferDesc: { fontSize: 13, fontWeight: '600', color: Theme.foreground },
  transferMeta: { fontSize: 11, color: Theme.mutedForeground, marginTop: 2 },
  transferTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  transferTagText: { fontSize: 10, fontWeight: '700' },
});
