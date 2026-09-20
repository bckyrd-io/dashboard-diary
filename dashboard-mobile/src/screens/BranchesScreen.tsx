import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Building,
  MapPin,
  Plus,
  ChevronRight,
  Users,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Minus,
} from 'lucide-react-native';
import { api } from '../services/api';
import { Button, Card, EmptyState, ErrorState, ScreenHeader } from '../components/ui';
import { Theme } from '../constants/Theme';
import { useTransfer } from '../context/TransferContext';

interface Branch {
  id: number;
  name: string;
  location: string;
  userCount: number;
}

export default function BranchesScreen() {
  const navigation = useNavigation();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Transfer context
  const {
    items: transferItems,
    sourceBranchId,
    sourceBranchName,
    itemCount,
    clearTransfer,
    updateQuantity,
    removeItem,
  } = useTransfer();

  // Modal & Transfer execution state
  const [targetBranch, setTargetBranch] = useState<Branch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
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

  const handleBranchPress = (branch: Branch) => {
    // If we have items to transfer
    if (itemCount > 0) {
      if (sourceBranchId !== null && Number(branch.id) === Number(sourceBranchId)) {
        setInfoMessage(`"${branch.name}" is already the source branch. Please select a different branch to move the stock to.`);
        return;
      }
      // Target branch selected! Open confirmation modal
      setTargetBranch(branch);
      setTransferError('');
      setIsModalOpen(true);
    } else {
      // Normal navigation to view stock
      (navigation as any).navigate('BranchStock', {
        branchId: branch.id,
        branchName: branch.name,
        location: branch.location,
      });
    }
  };

  const handleOpenReview = () => {
    // Open review modal even without a destination pre-selected, or pick first other branch
    const firstOther = branches.find((b) => Number(b.id) !== Number(sourceBranchId));
    setTargetBranch(firstOther || null);
    setTransferError('');
    setIsModalOpen(true);
  };

  const executeTransfer = async () => {
    if (!sourceBranchId || !targetBranch) return;

    setTransferring(true);
    setTransferError('');
    try {
      const payload = {
        eventType: 'transfer',
        financialType: 'Neutral',
        description: `Transferred ${itemCount} item(s) from ${sourceBranchName} to ${targetBranch.name}`,
        branchId: Number(sourceBranchId),
        toBranchId: Number(targetBranch.id),
        date: new Date().toISOString().split('T')[0],
        items: transferItems.map((it) => ({
          itemId: Number(it.itemId),
          quantity: Number(it.quantity),
          unitPriceAtSale: Number(it.price) || 0,
        })),
      };

      const result = await api.post<{ success: boolean; message?: string }>('/api/events', payload);
      if (result.success) {
        setIsModalOpen(false);
        setSuccessMessage(`Successfully transferred ${itemCount} item(s) to ${targetBranch.name}!`);
        clearTransfer();
        fetchBranches();
      } else {
        setTransferError(result.message || 'Could not complete transfer.');
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      setTransferError(err.message || 'Failed to process stock transfer.');
    } finally {
      setTransferring(false);
    }
  };

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

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
        title=""
        description={`${branches.length} store branches`}
        action={
          <Button
            style={{ paddingHorizontal: 12 }}
            onPress={() => navigation.navigate('AddBranch' as never)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}></Text>
            </View>
          </Button>
        }
      />
      {error ? <ErrorState message={error} /> : null}

      {/* Info notice if source branch clicked */}
      {infoMessage ? (
        <View style={styles.infoBanner}>
          <AlertCircle size={16} color="#b45309" />
          <Text style={styles.infoBannerText}>{infoMessage}</Text>
          <TouchableOpacity onPress={() => setInfoMessage('')}>
            <X size={16} color="#b45309" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Success notice */}
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
              <View style={styles.transferBannerHeader}>
                <View style={styles.transferBannerLeft}>
                  <ArrowLeftRight size={18} color="#fff" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.transferBannerTitle}>
                      Stock Transfer Active ({itemCount} item{itemCount === 1 ? '' : 's'})
                    </Text>
                    <Text style={styles.transferBannerSub}>
                      From {sourceBranchName} • Tap destination branch below
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.transferBannerActions}>
                <TouchableOpacity onPress={handleOpenReview} style={styles.reviewBtn}>
                  <Text style={styles.reviewBtnText}>Review Items</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearTransfer} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isSource = sourceBranchId !== null && Number(item.id) === Number(sourceBranchId);
          const isTransferActive = itemCount > 0;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleBranchPress(item)}
            >
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
                    <Building
                      size={20}
                      color={
                        isSource && isTransferActive
                          ? '#dc2626'
                          : !isSource && isTransferActive
                          ? Theme.primary
                          : Theme.primary
                      }
                    />
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
                    <View style={styles.transferHereAction}>
                      <Text style={styles.transferHereText}>Move Here</Text>
                      <ArrowRight size={14} color="#fff" />
                    </View>
                  ) : (
                    <ChevronRight size={18} color={Theme.gray400} />
                  )}
                </View>

                <View style={styles.branchFooter}>
                  <View style={styles.metricItem}>
                    <Users size={14} color={Theme.mutedForeground} />
                    <Text style={styles.metricText}>{item.userCount} staff</Text>
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

      {/* Confirmation & Review Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!transferring) setIsModalOpen(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ArrowLeftRight size={20} color={Theme.primary} />
                <Text style={styles.modalTitle}>Confirm Stock Transfer</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!transferring) setIsModalOpen(false);
                }}
                disabled={transferring}
                style={styles.closeBtn}
              >
                <X size={18} color={Theme.gray500} />
              </TouchableOpacity>
            </View>

            {/* Source -> Destination Route */}
            <View style={styles.routeContainer}>
              <View style={styles.routeCol}>
                <Text style={styles.routeLabel}>From (Source)</Text>
                <Text style={styles.routeName}>{sourceBranchName}</Text>
              </View>
              <View style={styles.routeArrow}>
                <ArrowRight size={18} color={Theme.primary} />
              </View>
              <View style={styles.routeCol}>
                <Text style={styles.routeLabel}>To (Destination)</Text>
                <Text style={styles.routeName}>{targetBranch ? targetBranch.name : 'Select a branch'}</Text>
              </View>
            </View>

            {/* Error in modal */}
            {transferError ? (
              <View style={styles.modalError}>
                <AlertCircle size={15} color="#dc2626" />
                <Text style={styles.modalErrorText}>{transferError}</Text>
              </View>
            ) : null}

            {/* Transfer Items List */}
            <Text style={styles.itemsListTitle}>
              Items to Transfer ({itemCount} units across {transferItems.length} product{transferItems.length === 1 ? '' : 's'})
            </Text>

            <ScrollView style={styles.itemsScrollView} contentContainerStyle={{ gap: 8 }}>
              {transferItems.length === 0 ? (
                <Text style={styles.emptyItemsText}>No items selected for transfer.</Text>
              ) : (
                transferItems.map((item) => (
                  <View key={item.itemId} style={styles.modalItemRow}>
                    <View style={styles.modalItemIcon}>
                      <Package size={16} color={Theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      <Text style={styles.modalItemPrice}>{formatPrice(item.price)} each</Text>
                    </View>

                    {/* Quantity controls */}
                    <View style={styles.modalQtyControls}>
                      <TouchableOpacity
                        style={styles.modalQtyBtn}
                        onPress={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.itemId, item.quantity - 1);
                          } else {
                            removeItem(item.itemId);
                          }
                        }}
                      >
                        <Minus size={12} color={Theme.foreground} />
                      </TouchableOpacity>
                      <Text style={styles.modalQtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[
                          styles.modalQtyBtn,
                          item.quantity >= item.maxQuantity && { opacity: 0.3 },
                        ]}
                        disabled={item.quantity >= item.maxQuantity}
                        onPress={() => updateQuantity(item.itemId, item.quantity + 1)}
                      >
                        <Plus size={12} color={Theme.foreground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Change destination branch picker if needed */}
            <View style={styles.changeDestRow}>
              <Text style={styles.changeDestLabel}>Destination:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 8 }}>
                {branches
                  .filter((b) => Number(b.id) !== Number(sourceBranchId))
                  .map((b) => {
                    const isSelected = targetBranch?.id === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        onPress={() => setTargetBranch(b)}
                        style={[
                          styles.branchPill,
                          isSelected && styles.branchPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.branchPillText,
                            isSelected && styles.branchPillTextSelected,
                          ]}
                        >
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsModalOpen(false)}
                disabled={transferring}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  (!targetBranch || transferItems.length === 0 || transferring) && { opacity: 0.6 },
                ]}
                disabled={!targetBranch || transferItems.length === 0 || transferring}
                onPress={executeTransfer}
              >
                {transferring ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.modalConfirmText}>
                      Confirm Transfer
                    </Text>
                    <ArrowRight size={16} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.muted },
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
  transferHereAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  transferHereText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  transferBanner: {
    backgroundColor: Theme.primary,
    marginBottom: 14,
    padding: 14,
    borderRadius: Theme.radius,
  },
  transferBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  reviewBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reviewBtnText: {
    color: Theme.primary,
    fontSize: 12,
    fontWeight: '700',
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Theme.background,
    borderRadius: 14,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.foreground,
  },
  closeBtn: {
    padding: 4,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  routeCol: {
    flex: 1,
  },
  routeArrow: {
    paddingHorizontal: 10,
  },
  routeLabel: {
    fontSize: 11,
    color: Theme.mutedForeground,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  routeName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.foreground,
    marginTop: 2,
  },
  modalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalErrorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  itemsListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.foreground,
    marginBottom: 8,
  },
  itemsScrollView: {
    maxHeight: 180,
    marginBottom: 14,
  },
  emptyItemsText: {
    fontSize: 13,
    color: Theme.mutedForeground,
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.muted,
    padding: 10,
    borderRadius: 8,
  },
  modalItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.foreground,
  },
  modalItemPrice: {
    fontSize: 11,
    color: Theme.mutedForeground,
    marginTop: 1,
  },
  modalQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  modalQtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  modalQtyText: {
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Theme.foreground,
  },
  changeDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  changeDestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.mutedForeground,
  },
  branchPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Theme.muted,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  branchPillSelected: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  branchPillText: {
    fontSize: 12,
    color: Theme.gray700,
    fontWeight: '500',
  },
  branchPillTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Theme.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: Theme.foreground,
    fontWeight: '600',
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
