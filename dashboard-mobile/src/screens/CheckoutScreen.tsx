import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  X,
} from 'lucide-react-native';
import { useCart, CartItem } from '../context/CartContext';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';

type PaymentMethod = 'cash' | 'airtel_money' | 'tnm_mpamba';

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

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { items, total, itemCount, updateQuantity, removeItem, setCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [pastSales, setPastSales] = useState<SaleEvent[]>([]);
  const [pastSalesLoading, setPastSalesLoading] = useState(true);
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);

  const paymentMethods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'tnm_mpamba', label: 'Mobile', icon: Smartphone },
  ];

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  const fetchPastSales = async () => {
    try {
      const result = await api.get<{ success: boolean; events: SaleEvent[] }>(
        '/api/events?event_type=sale'
      );
      if (result.success) {
        setPastSales(result.events);
      }
    } catch (error) {
      console.error('Error fetching past sales:', error);
    } finally {
      setPastSalesLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPastSales();
    }, [])
  );

  const handleSelectPastSale = async (sale: SaleEvent) => {
    setLoading(true);
    try {
      const result = await api.get<{ success: boolean; event: any }>(`/api/events/${sale.id}`);
      if (result.success && result.event) {
        const ev = result.event;
        const populatedItems: CartItem[] = (ev.items || []).map((it: any) => ({
          itemId: it.itemId,
          name: it.itemName || `Item #${it.itemId}`,
          price: it.unitPriceAtSale,
          quantity: it.quantity,
          barcode: it.itemBarcode || null,
          imageUrl: it.itemImage || null,
        }));
        setCart(populatedItems);
        if (ev.paymentMethod && ['cash', 'airtel_money', 'tnm_mpamba'].includes(ev.paymentMethod)) {
          setSelectedPayment(ev.paymentMethod as PaymentMethod);
        }
        setEditingSaleId(ev.id);
      } else {
        Alert.alert('Error', 'Could not load checkout details.');
      }
    } catch (error) {
      console.error('Error fetching past sale details:', error);
      Alert.alert('Error', 'Failed to retrieve checkout items.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    clearCart();
    setEditingSaleId(null);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to the cart before checkout.');
      return;
    }
    if (editingSaleId) {
      Alert.alert(
        'Update Checkout',
        `Save changes to Checkout #${editingSaleId}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update', onPress: processUpdateCheckout },
        ]
      );
    } else {
      (navigation as any).navigate('PaymentScreen', {
        items: items.map((i) => ({
          itemId: i.itemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total,
        paymentMethod: selectedPayment,
      });
    }
  };

  const processUpdateCheckout = async () => {
    if (!editingSaleId) return;
    setLoading(true);
    try {
      const result = await api.put<{ success: boolean; message?: string }>(
        `/api/events/${editingSaleId}`,
        {
          items: items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPriceAtSale: item.price,
          })),
          paymentMethod: selectedPayment,
          description: `Sale - ${items.length} item(s)`,
        }
      );
      if (result.success) {
        Alert.alert('Checkout Updated', `Checkout #${editingSaleId} updated successfully.`);
        clearCart();
        setEditingSaleId(null);
        fetchPastSales();
      } else {
        Alert.alert('Update Failed', result.message || 'Could not update checkout.');
      }
    } catch (error) {
      console.error('Update checkout error:', error);
      Alert.alert('Error', 'An error occurred while updating checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCheckout = () => {
    if (!editingSaleId) return;
    Alert.alert(
      'Delete Checkout',
      `Delete Checkout #${editingSaleId}? Inventory will be restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await api.delete<{ success: boolean; message?: string }>(
                `/api/events/${editingSaleId}`
              );
              if (result.success) {
                Alert.alert('Deleted', `Checkout #${editingSaleId} deleted.`);
                clearCart();
                setEditingSaleId(null);
                fetchPastSales();
              } else {
                Alert.alert('Delete Failed', result.message || 'Could not delete.');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete checkout.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getPaymentIcon = (status: string | null) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} color={Theme.success} />;
      case 'failed': return <XCircle size={14} color={Theme.error} />;
      default: return <Clock size={14} color={Theme.warning} />;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'airtel_money': return 'Airtel Money';
      case 'tnm_mpamba': return 'TNM Mpamba';
      default: return method || 'N/A';
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.itemId, item.quantity - 1)}
        >
          <Minus size={16} color={Theme.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.quantityInput}
          value={item.quantity.toString()}
          onChangeText={(text) => updateQuantity(item.itemId, parseInt(text) || 0)}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.itemId, item.quantity + 1)}
        >
          <Plus size={16} color={Theme.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.lineTotal}>
        <Text style={styles.lineTotalText}>{formatPrice(item.price * item.quantity)}</Text>
        <TouchableOpacity onPress={() => removeItem(item.itemId)} style={styles.removeButton}>
          <Trash2 size={16} color={Theme.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSale = ({ item }: { item: SaleEvent }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => handleSelectPastSale(item)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <Text style={styles.saleDescription} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.saleDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.saleAmount}>{formatPrice(item.amount)}</Text>
      </View>
      <View style={styles.saleFooter}>
        <View style={styles.paymentInfo}>
          <CreditCard size={14} color={Theme.gray500} />
          <Text style={styles.paymentMethod}>{getPaymentMethodLabel(item.paymentMethod)}</Text>
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

  return (
    <View style={styles.container}>
      {/* Edit Mode Banner */}
      {editingSaleId && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>Editing Checkout #{editingSaleId}</Text>
          <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditBtn}>
            <X size={14} color="#92400e" />
            <Text style={styles.cancelEditText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items.length > 0 ? items : []}
        keyExtractor={(item) => item.itemId.toString()}
        renderItem={renderCartItem}
        contentContainerStyle={styles.cartList}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {items.length > 0 ? `Cart (${itemCount} items)` : 'Cart is empty'}
          </Text>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentOption,
                        selectedPayment === method.id && styles.paymentOptionActive,
                      ]}
                      onPress={() => setSelectedPayment(method.id)}
                    >
                      <Icon size={20} color={selectedPayment === method.id ? Theme.primary : Theme.gray500} />
                      <Text
                        style={[
                          styles.paymentOptionText,
                          selectedPayment === method.id && styles.paymentOptionTextActive,
                        ]}
                      >
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total ({itemCount} items)</Text>
                <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.payButton, (loading || items.length === 0) && styles.payButtonDisabled]}
                onPress={handleCheckout}
                disabled={loading || items.length === 0}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CreditCard size={20} color="#fff" />
                    <Text style={styles.payButtonText}>
                      {editingSaleId ? 'Update Checkout' : 'Continue to Payment'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {editingSaleId && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteCheckout}
                  disabled={loading}
                >
                  <Trash2 size={18} color={Theme.destructive} />
                  <Text style={styles.deleteButtonText}>Delete & Restore Stock</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyCart}>
              <ShoppingCart size={48} color={Theme.gray300} />
              <Text style={styles.emptyCartText}>No items in cart</Text>
              <Text style={styles.emptyCartHint}>Scan a barcode or add items from the Items screen</Text>
            </View>
          )
        }
        ListEmptyComponent={null}
      />

      {/* Past Sales Section */}
      <View style={styles.pastSalesSection}>
        <Text style={styles.pastSalesTitle}>Past Checkouts</Text>
        {pastSalesLoading ? (
          <ActivityIndicator size="small" color={Theme.primary} style={{ paddingVertical: 20 }} />
        ) : pastSales.length > 0 ? (
          <FlatList
            data={pastSales}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSale}
            contentContainerStyle={styles.pastSalesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyPastSales}>
            <DollarSign size={32} color={Theme.gray300} />
            <Text style={styles.emptyPastSalesText}>No past checkouts</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editBannerText: { fontSize: 13, color: '#92400e', fontWeight: '600', flex: 1 },
  cancelEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  cancelEditText: { fontSize: 12, color: '#92400e', fontWeight: '600' },
  cartList: { padding: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Theme.foreground, marginBottom: 10 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Theme.muted,
    borderRadius: Theme.radius,
    marginBottom: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Theme.foreground, marginBottom: 4 },
  itemPrice: { fontSize: 13, color: Theme.gray500 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Theme.foreground,
    marginHorizontal: 4,
  },
  lineTotal: { alignItems: 'flex-end' },
  lineTotalText: { fontSize: 13, fontWeight: '600', color: Theme.foreground, marginBottom: 4 },
  removeButton: { padding: 4 },
  paymentSection: { marginTop: 8 },
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  paymentOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.muted,
    gap: 6,
  },
  paymentOptionActive: { borderColor: Theme.primary, backgroundColor: Theme.primaryLight },
  paymentOptionText: { fontSize: 12, color: Theme.gray600 },
  paymentOptionTextActive: { color: Theme.primary, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 14, color: Theme.gray600 },
  totalAmount: { fontSize: 22, fontWeight: '700', color: Theme.primary },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primary,
    paddingVertical: 14,
    borderRadius: Theme.radius,
    gap: 8,
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: Theme.radius,
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: { color: Theme.destructive, fontSize: 14, fontWeight: '600' },
  emptyCart: { alignItems: 'center', paddingVertical: 32 },
  emptyCartText: { fontSize: 16, fontWeight: '600', color: Theme.gray500, marginTop: 12 },
  emptyCartHint: { fontSize: 13, color: Theme.gray400, marginTop: 4, textAlign: 'center' },
  pastSalesSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  pastSalesTitle: { fontSize: 15, fontWeight: '600', color: Theme.foreground, marginBottom: 10 },
  pastSalesList: { paddingBottom: 16 },
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
    marginBottom: 8,
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
  emptyPastSales: { alignItems: 'center', paddingVertical: 32 },
  emptyPastSalesText: { fontSize: 14, color: Theme.gray500, marginTop: 8 },
});
