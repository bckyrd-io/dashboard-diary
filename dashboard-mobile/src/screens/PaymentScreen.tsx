import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  CreditCard,
  Smartphone,
  Banknote,
  Radio,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';
import { ScreenHeader, Card } from '../components/ui';
import { nfcService, NfcPaymentResult } from '../services/nfcService';

type PaymentMethod = 'cash' | 'nfc_tap' | 'airtel_money' | 'tnm_mpamba';

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

type NfcState = 'scanning' | 'processing' | 'error';

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  nfc_tap: 'NFC Card Tap',
  airtel_money: 'Airtel Money',
  tnm_mpamba: 'TNM Mpamba',
};

const methodIcons: Record<PaymentMethod, typeof CreditCard> = {
  cash: Banknote,
  nfc_tap: Radio,
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
  const [nfcState, setNfcState] = useState<NfcState | null>(paymentMethod === 'nfc_tap' ? 'scanning' : null);
  const [nfcError, setNfcError] = useState('');
  const [hasHardware, setHasHardware] = useState(false);
  const [paymentResult, setPaymentResult] = useState<NfcPaymentResult | null>(null);

  const isMobileMoney = paymentMethod === 'tnm_mpamba' || paymentMethod === 'airtel_money';
  const isNfc = paymentMethod === 'nfc_tap';
  const MethodIcon = methodIcons[paymentMethod];

  // Radar pulse animations (inline NFC — no modal)
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.8)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | undefined;
    if (isNfc && nfcState === 'scanning' && !paidResult) {
      anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, { toValue: 1.6, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseAnim1, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity1, { toValue: 0, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseOpacity1, { toValue: 0.8, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(pulseAnim2, { toValue: 1.9, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseAnim2, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(pulseOpacity2, { toValue: 0, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseOpacity2, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [isNfc, nfcState, paidResult]);

  const startNfcWorkflow = useCallback(async () => {
    setNfcState('scanning');
    setNfcError('');
    setPaymentResult(null);
    const supported = await nfcService.isSupported();
    setHasHardware(supported);

    if (supported) {
      nfcService
        .startCardPayment(total)
        .then((res) => {
          if (res.success) {
            handleCardSuccess(res);
          } else if (res.error && !res.error.includes('cancelled')) {
            setNfcError(res.error);
            setNfcState('error');
          }
        })
        .catch((err: any) => {
          setNfcError(err?.message || 'NFC read failed');
          setNfcState('error');
        });
    }
  }, [total]);

  useEffect(() => {
    if (isNfc && !paidResult) {
      startNfcWorkflow();
    }
    return () => {
      nfcService.cancelSession();
    };
  }, []);

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

  const handleCardSuccess = (res: NfcPaymentResult) => {
    setNfcState('processing');
    setTimeout(async () => {
      setPaymentResult(res);
      const cardInfo = `${res.cardBrand || 'NFC Contactless'} (•••• ${res.lastFour})`;
      await processPayment(res.reference, `Sale - ${items.length} item(s) [${cardInfo}]`);
    }, 800);
  };

  const handleSimulatedTap = async (brand: 'Visa Contactless' | 'Mastercard Contactless') => {
    setNfcState('processing');
    try {
      const res = await nfcService.simulateCardPayment(total, brand);
      handleCardSuccess(res);
    } catch (e: any) {
      setNfcError(e?.message || 'Simulation failed');
      setNfcState('error');
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
    } else if (isNfc) {
      // NFC pays via tap flow above
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
      <ScreenHeader
        title="Payment"
        description={`${items.length} item${items.length === 1 ? '' : 's'} • ${methodLabels[paymentMethod]}`}
        back={() => navigation.goBack()}
      />

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
                {isNfc
                  ? 'Contactless card or phone'
                  : isMobileMoney
                  ? 'Mobile money transfer'
                  : 'Cash payment'}
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

        {/* NFC inline tap-to-pay */}
        {isNfc && (
          <Card style={styles.nfcCard}>
            {nfcState === 'scanning' && (
              <View style={styles.nfcCenter}>
                <View style={styles.radarWrapper}>
                  <Animated.View
                    style={[styles.pulseCircle, { transform: [{ scale: pulseAnim2 }], opacity: pulseOpacity2 }]}
                  />
                  <Animated.View
                    style={[styles.pulseCircle, { transform: [{ scale: pulseAnim1 }], opacity: pulseOpacity1 }]}
                  />
                  <View style={styles.deviceIconCircle}>
                    <Smartphone size={40} color="#ffffff" />
                  </View>
                </View>
                <Text style={styles.nfcTitle}>Ready for Contactless Tap</Text>
                <Text style={styles.nfcSubtitle}>
                  Hold the customer's card or phone against the back of this device
                </Text>

                <View style={styles.simulatorBox}>
                  <View style={styles.simulatorHeader}>
                    <Sparkles size={14} color={Theme.primary} />
                    <Text style={styles.simulatorLabel}>
                      {hasHardware ? 'Or Test with Simulator:' : 'Hardware not detected. Test Tap:'}
                    </Text>
                  </View>
                  <View style={styles.simButtonsRow}>
                    <TouchableOpacity style={styles.simBtn} onPress={() => handleSimulatedTap('Visa Contactless')}>
                      <CreditCard size={14} color="#1E3A8A" />
                      <Text style={styles.simBtnText}>Tap Visa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.simBtn, styles.simBtnMastercard]}
                      onPress={() => handleSimulatedTap('Mastercard Contactless')}
                    >
                      <CreditCard size={14} color="#C2410C" />
                      <Text style={[styles.simBtnText, { color: '#C2410C' }]}>Tap Mastercard</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {nfcState === 'processing' && (
              <View style={styles.nfcCenter}>
                <ActivityIndicator size="large" color={Theme.primary} />
                <Text style={styles.nfcTitle}>Authorizing Payment...</Text>
                <Text style={styles.nfcSubtitle}>
                  {paymentResult
                    ? `${paymentResult.cardBrand || 'Contactless Card'} •••• ${paymentResult.lastFour}`
                    : 'Verifying card with POS terminal'}
                </Text>
                {paymentResult?.isSimulated ? <Text style={styles.simulatedBadge}>Test Mode</Text> : null}
              </View>
            )}

            {nfcState === 'error' && (
              <View style={styles.nfcCenter}>
                <View style={styles.errorIconCircle}>
                  <AlertCircle size={44} color="#dc2626" />
                </View>
                <Text style={styles.nfcErrorTitle}>Card Read Failed</Text>
                <Text style={styles.nfcSubtitle}>{nfcError || 'Could not communicate with contactless card.'}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={startNfcWorkflow}>
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
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

        {/* Pay button (cash / mobile money) */}
        {!isNfc && (
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
        )}

        <Text style={styles.secureNote}>
          {isNfc
            ? 'Payment is processed when the card is tapped.'
            : 'You will not be charged until you tap the pay button.'}
        </Text>
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
  nfcCard: { marginBottom: 14, paddingVertical: 24 },
  nfcCenter: { alignItems: 'center' },
  radarWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#BBF7D0',
  },
  deviceIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  nfcTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.foreground,
    textAlign: 'center',
    marginTop: 4,
  },
  nfcSubtitle: {
    fontSize: 13,
    color: Theme.mutedForeground,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  nfcErrorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 12,
  },
  simulatorBox: {
    marginTop: 20,
    width: '100%',
    padding: 12,
    backgroundColor: Theme.muted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  simulatorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  simulatorLabel: { fontSize: 12, fontWeight: '600', color: Theme.gray700 },
  simButtonsRow: { flexDirection: 'row', gap: 10 },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  simBtnMastercard: { backgroundColor: '#FFEDD5', borderColor: '#FDBA74' },
  simBtnText: { fontSize: 12, fontWeight: '600', color: '#1E3A8A' },
  simulatedBadge: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: Theme.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
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
