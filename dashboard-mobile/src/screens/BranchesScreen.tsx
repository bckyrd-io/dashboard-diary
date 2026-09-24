import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Building,
  MapPin,
  Plus,
  ChevronRight,
  Package,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Card, EmptyState, ErrorState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
import { useTransfer } from '../context/TransferContext';
import { confirmDialog } from '../utils/confirm';

interface Branch {
  id: number;
  name: string;
  location: string;
  itemCount: number;
}

export default function BranchesScreen() {
  const navigation = useNavigation();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const {
    items: transferItems,
    sourceBranchId,
    sourceBranchName,
    itemCount,
    clearTransfer,
  } = useTransfer();

  const [transferring, setTransferring] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const fetchBranches = async () => {
    try {
      const result = await api.get<{ branches: Branch[] }>('/api/branches');
      setBranches(result.branches ?? []);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load branches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBranches();
    }, [])
  );

  const executeTransfer = async (destBranch: Branch) => {
    if (!sourceBranchId || transferItems.length === 0) return;

    setTransferring(true);
    try {
      const payload = {
        eventType: 'transfer',
        financialType: 'Neutral',
        description: `Transferred ${itemCount} item(s) from ${sourceBranchName} to ${destBranch.name}`,
        branchId: Number(sourceBranchId),
        toBranchId: Number(destBranch.id),
        date: new Date().toISOString().split('T')[0],
        items: transferItems.map((it) => ({
          itemId: Number(it.itemId),
          quantity: Number(it.quantity),
          unitPriceAtSale: Number(it.price) || 0,
        })),
      };

      const result = await api.post<{ success: boolean; message?: string }>('/api/events', payload);
      if (result.success) {
        setSuccessMessage(`Successfully transferred ${itemCount} item(s) to ${destBranch.name}!`);
        clearTransfer();
        fetchBranches();
      } else {
        Alert.alert('Transfer Failed', result.message || 'Could not complete transfer.');
      }
} catch (err: any) {
      console.error('Transfer error:', err);
      Alert.alert('Transfer Failed', err.message || 'Failed to process stock transfer.');
    } finally {
      setTransferring(false);
    }
  };

  const handleBranchPress = (branch: Branch) => {
    if (itemCount > 0) {
      if (sourceBranchId !== null && Number(branch.id) === Number(sourceBranchId)) {
        setInfoMessage(
          `"${branch.name}" is already the source branch. Please select a different branch to move the stock to.`
        );
        return;
      }
      confirmDialog(
        'Confirm Transfer',
        `Transfer ${itemCount} item${itemCount === 1 ? '' : 's'} from ${sourceBranchName} to ${branch.name}?`,
        () => executeTransfer(branch)
      );
    } else {
      (navigation as any).navigate('BranchStock', {
        branchId: branch.id,
        branchName: branch.name,
        location: branch.location,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Distribution & Branches"
        description={`${branches.length} store branches`}
        action={
          <Button
            variant="outline"
            style={styles.addButton}
            onPress={() => navigation.navigate('AddBranch' as never)}
          >
            <Plus size={20} color={Theme.primary} />
          </Button>
        }
      />
      {error ? <ErrorState message={error} /> : null}

      {infoMessage ? (
        <View style={styles.infoBanner}>
          <AlertCircle size={16} color="#b45309" />
          <Text style={styles.infoBannerText}>{infoMessage}</Text>
          <TouchableOpacity onPress={() => setInfoMessage('')}>
            <X size={16} color="#b45309" />
          </TouchableOpacity>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.successBanner}>
          <CheckCircle2 size={16} color="#15803d" />
          <Text style={styles.successBannerText}>{successMessage}</Text>
          <TouchableOpacity onPress={() => setSuccessMessage('')}>
            <X size={16} color="#15803d" />
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={branches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBranches();
            }}
            tintColor={Theme.primary}
          />
        }
        ListEmptyComponent={<EmptyState icon={Building} message="No branches available" />}
        ListHeaderComponent={
          itemCount > 0 ? (
            <View style={styles.transferBanner}>
              <View style={styles.transferBannerLeft}>
                <ArrowLeftRight size={18} color="#fff" />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.transferBannerTitle}>
                    Stock Transfer Active ({itemCount} item{itemCount === 1 ? '' : 's'})
                  </Text>
                  <Text style={styles.transferBannerSub}>
                    From {sourceBranchName} • Tap a destination branch to confirm
                  </Text>
                </View>
              </View>
              <View style={styles.transferBannerActions}>
                <TouchableOpacity onPress={clearTransfer} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isSource = sourceBranchId !== null && Number(item.id) === Number(sourceBranchId);
          const isTransferActive = itemCount > 0;

          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleBranchPress(item)}>
              <Card
                style={[
                  styles.card,
                  isSource && isTransferActive && styles.sourceCard,
                  !isSource && isTransferActive && styles.targetCandidateCard,
                ]}
              >
                <View style={styles.branchRow}>
                  <View
                    style={[
                      styles.branchIcon,
                      isSource && isTransferActive && { backgroundColor: '#fee2e2' },
                      !isSource && isTransferActive && { backgroundColor: '#dbeafe' },
                    ]}
                  >
                    <Building size={20} color={isSource && isTransferActive ? '#dc2626' : Theme.primary} />
                  </View>

                  <View style={styles.branchInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.branchName}>{item.name}</Text>
                      {isSource && isTransferActive && (
                        <View style={styles.sourceBadge}>
                          <Text style={styles.sourceBadgeText}>Source Branch</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.locationRow}>
                      <MapPin size={13} color={Theme.mutedForeground} />
                      <Text style={styles.branchLocation}>{item.location}</Text>
                    </View>
                  </View>

                  {isTransferActive && !isSource ? (
                    <ChevronRight size={18} color={Theme.primary} />
                  ) : (
                    <ChevronRight size={18} color={Theme.gray400} />
                  )}
                </View>

                <View style={styles.branchFooter}>
                  <View style={styles.metricItem}>
                    <Package size={14} color={Theme.mutedForeground} />
                    <Text style={styles.metricText}>
                      {item.itemCount} item{item.itemCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  {isTransferActive && !isSource ? (
                    <Text style={styles.targetHint}>Tap to complete transfer</Text>
                  ) : null}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.muted },
  addButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 20,
  },
  card: { marginBottom: 12, padding: 14 },
  sourceCard: { borderColor: '#fca5a5', borderWidth: 1.5, backgroundColor: '#fff5f5' },
  targetCandidateCard: { borderColor: Theme.primary, borderWidth: 1 },
  branchRow: { flexDirection: 'row', alignItems: 'center' },
  branchIcon: {
    width: 42,
    height: 42,
    borderRadius: Theme.radius,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  branchName: { fontWeight: '700', color: Theme.gray900, fontSize: 15, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  branchLocation: { color: Theme.mutedForeground, fontSize: 13 },
  branchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { color: Theme.mutedForeground, fontSize: 12 },
  targetHint: { fontSize: 11, fontWeight: '600', color: Theme.primary },
  sourceBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadgeText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '700',
  },
  transferBanner: {
    backgroundColor: Theme.primary,
    marginBottom: 14,
    padding: 14,
    borderRadius: Theme.radius,
  },
  transferBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transferBannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  transferBannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  transferBannerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
});
