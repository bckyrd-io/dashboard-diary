import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CreditCard, Smartphone, Banknote, CheckCircle2 } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';
import { ScreenHeader, Card } from '../components/ui';

type PaymentMethod = 'cash' | 'airtel_money' | 'tnm_mpamba';

interface PaymentItem {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
}

interface PaymentParams {
  items: PaymentItem[];
  total: number;
  paymentMethod: PaymentMethod;
}

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  airtel_money: 'Airtel Money',
  tnm_mpamba: 'TNM Mpamba',
};

const methodIcons: Record<PaymentMethod, typeof CreditCard> = {
  cash: Banknote,
  airtel_money: Smartphone,
  tnm_mpamba: Smartphone,
};

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params ?? {}) as PaymentParams;
  const { items = [], total = 0, paymentMethod = 'cash' } = params;

  const { clearCart } = useCart();

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paidResult, setPaidResult] = useState<{ reference: string | null; amount: number } | null>(null);

  const isMobileMoney = paymentMethod === 'tnm_mpamba' || paymentMethod === 'airtel_money';
  const MethodIcon = methodIcons[paymentMethod];

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  const processPayment = async (reference?: string, description?: string) => {
    setPaying(true);
    try {
      const result = await api.post<{ success: boolean; event: any; message?: string }>(
        '/api/checkout',
        {
          items: items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPriceAtSale: item.price,
          })),
          paymentMethod,
          paymentReference: reference || null,
          description: description || `Sale - ${items.length} item(s)`,
        }
      );
      if (result.success) {
        clearCart();
        setPaidResult({ reference: reference || null, amount: total });
      } else {
        Alert.alert('Payment Failed', result.message || 'Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', error?.message || 'An error occurred. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const validatePhone = (value: string) => {
    const digits = value.replace(/\s/g, '');
    if (!digits) {
      setPhoneError('Phone number is required.');
      return false;
    }
    if (!/^0\d{9}$/.test(digits)) {
      setPhoneError('Enter a valid number, e.g. 0991234567.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePay = () => {
    if (isMobileMoney) {
      if (!validatePhone(phone)) return;
      const digits = phone.replace(/\s/g, '');
      processPayment(
        `MOMO-${digits}`,
        `Sale - ${items.length} item(s) [${methodLabels[paymentMethod]} ${digits}]`
      );
    } else {
      processPayment();
    }
  };

  const handleDone = () => {
    navigation.goBack();
  };

  // ── Paid success state ─────────────────────────────────────────────────────
  if (paidResult) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Payment" back={handleDone} />
        <View style={styles.successBox}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={56} color="#16a34a" />
          </View>
          <Text style={styles.successTitle}>Payment Successful</Text>
          <Text style={styles.successAmount}>{formatPrice(paidResult.amount)}</Text>
          <Text style={styles.successMethod}>{methodLabels[paymentMethod]}</Text>
          {paidResult.reference ? (
            <Text style={styles.successRef}>Ref: {paidResult.reference}</Text>
          ) : null}
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Payment" back={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Summary — pre-filled */}
        <Card style={styles.summaryCard}>
          <View style={styles.methodRow}>
            <View style={styles.methodIconCircle}>
              <MethodIcon size={18} color={Theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodLabel}>{methodLabels[paymentMethod]}</Text>
              <Text style={styles.methodHint}>
                {isMobileMoney ? 'Mobile money transfer' : 'Cash payment'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {items.map((item) => (
            <View key={item.itemId} style={styles.summaryRow}>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {item.name} <Text style={styles.summaryQty}>× {item.quantity}</Text>
              </Text>
              <Text style={styles.summaryItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          </View>
        </Card>

        {/* Mobile money phone input */}
        {isMobileMoney && (
          <Card style={styles.phoneCard}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <Text style={styles.inputHint}>
              {methodLabels[paymentMethod]} number to charge
            </Text>
            <View style={[styles.phoneInputRow, phoneError ? styles.phoneInputError : null]}>
              <Text style={styles.phonePrefix}>+265</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (phoneError) validatePhone(t);
                }}
                onBlur={() => validatePhone(phone)}
                placeholder="0991234567"
                placeholderTextColor={Theme.gray400}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          </Card>
        )}

        {/* Cash hint */}
        {paymentMethod === 'cash' && (
          <Card style={styles.cashCard}>
            <Banknote size={20} color={Theme.success} />
            <Text style={styles.cashText}>
              Collect {formatPrice(total)} in cash from the customer, then confirm the payment below.
            </Text>
          </Card>
        )}

        {/* Pay button */}
        <TouchableOpacity
          style={[styles.payButton, (paying || items.length === 0) && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={paying || items.length === 0}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CreditCard size={20} color="#fff" />
              <Text style={styles.payButtonText}>Pay with PayChangu</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.secureNote}>You will not be charged until you tap the pay button.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.muted },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: { marginBottom: 14 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Theme.radius,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { fontSize: 15, fontWeight: '700', color: Theme.foreground },
  methodHint: { fontSize: 12, color: Theme.mutedForeground, marginTop: 1 },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryItemName: { flex: 1, fontSize: 14, color: Theme.foreground, marginRight: 8 },
  summaryQty: { fontSize: 12, color: Theme.mutedForeground },
  summaryItemPrice: { fontSize: 14, fontWeight: '600', color: Theme.foreground },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: Theme.gray700 },
  totalAmount: { fontSize: 22, fontWeight: '800', color: Theme.primary },
  phoneCard: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: Theme.foreground },
  inputHint: { fontSize: 12, color: Theme.mutedForeground, marginTop: 2, marginBottom: 10 },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    backgroundColor: Theme.muted,
    paddingHorizontal: 12,
  },
  phoneInputError: { borderColor: Theme.destructive },
  phonePrefix: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.mutedForeground,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.foreground,
  },
  errorText: { fontSize: 12, color: Theme.destructive, marginTop: 6 },
  cashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cashText: { flex: 1, fontSize: 13, color: Theme.gray700, lineHeight: 18 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primary,
    paddingVertical: 15,
    borderRadius: Theme.radius,
    gap: 8,
    marginTop: 4,
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secureNote: {
    fontSize: 12,
    color: Theme.mutedForeground,
    textAlign: 'center',
    marginTop: 12,
  },
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#15803D' },
  successAmount: { fontSize: 30, fontWeight: '800', color: Theme.foreground, marginTop: 8 },
  successMethod: { fontSize: 14, color: Theme.mutedForeground, marginTop: 4 },
  successRef: {
    fontSize: 12,
    color: Theme.mutedForeground,
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  doneBtn: {
    marginTop: 28,
    backgroundColor: Theme.primary,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: Theme.radius,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
