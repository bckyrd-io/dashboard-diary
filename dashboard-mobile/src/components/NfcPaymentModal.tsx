import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Radio,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  Sparkles,
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';
import { nfcService, NfcPaymentResult } from '../services/nfcService';

interface NfcPaymentModalProps {
  visible: boolean;
  totalAmount: number;
  onClose: () => void;
  onPaymentSuccess: (result: NfcPaymentResult) => void;
}

type ModalState = 'checking' | 'scanning' | 'processing' | 'success' | 'error';

export default function NfcPaymentModal({
  visible,
  totalAmount,
  onClose,
  onPaymentSuccess,
}: NfcPaymentModalProps) {
  const [modalState, setModalState] = useState<ModalState>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState<NfcPaymentResult | null>(null);
  const [hasHardware, setHasHardware] = useState(false);

  // Pulse animation for NFC radar waves
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.8)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (visible && modalState === 'scanning') {
      anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.6,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity1, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity1, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(pulseAnim2, {
              toValue: 1.9,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(pulseOpacity2, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity2, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [visible, modalState]);

  useEffect(() => {
    if (visible) {
      startNfcWorkflow();
    } else {
      nfcService.cancelSession();
      setModalState('checking');
      setPaymentResult(null);
      setErrorMessage('');
    }
  }, [visible]);

  const startNfcWorkflow = async () => {
    setModalState('checking');
    const supported = await nfcService.isSupported();
    setHasHardware(supported);

    setModalState('scanning');

    if (supported) {
      // Listen for physical NFC card tap
      nfcService
        .startCardPayment(totalAmount)
        .then((res) => {
          if (res.success) {
            handleCardSuccess(res);
          } else if (res.error && !res.error.includes('cancelled')) {
            setErrorMessage(res.error);
            setModalState('error');
          }
        })
        .catch((err) => {
          setErrorMessage(err?.message || 'NFC read failed');
          setModalState('error');
        });
    }
  };

  const handleCardSuccess = (res: NfcPaymentResult) => {
    setModalState('processing');
    setTimeout(() => {
      setPaymentResult(res);
      setModalState('success');
      setTimeout(() => {
        onPaymentSuccess(res);
      }, 1400);
    }, 800);
  };

  const handleSimulatedTap = async (brand: 'Visa Contactless' | 'Mastercard Contactless') => {
    setModalState('processing');
    try {
      const res = await nfcService.simulateCardPayment(totalAmount, brand);
      handleCardSuccess(res);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Simulation failed');
      setModalState('error');
    }
  };

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Radio size={20} color={Theme.primary} />
              <Text style={styles.title}>NFC Tap to Pay</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Theme.gray500} />
            </TouchableOpacity>
          </View>

          {/* Amount Badge */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total to Charge</Text>
            <Text style={styles.amountText}>{formatPrice(totalAmount)}</Text>
          </View>

          {/* Body based on state */}
          <View style={styles.body}>
            {modalState === 'scanning' && (
              <View style={styles.scanningContainer}>
                <View style={styles.radarWrapper}>
                  <Animated.View
                    style={[
                      styles.pulseCircle,
                      {
                        transform: [{ scale: pulseAnim2 }],
                        opacity: pulseOpacity2,
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.pulseCircle,
                      {
                        transform: [{ scale: pulseAnim1 }],
                        opacity: pulseOpacity1,
                      },
                    ]}
                  />
                  <View style={styles.deviceIconCircle}>
                    <Smartphone size={42} color="#ffffff" />
                  </View>
                </View>

                <Text style={styles.instructionTitle}>Ready for Contactless Tap</Text>
                <Text style={styles.instructionSubtitle}>
                  Hold customer bank card or phone against the back of this device
                </Text>

                {/* Simulator Options (Allows demo on any device/emulator) */}
                <View style={styles.simulatorBox}>
                  <View style={styles.simulatorHeader}>
                    <Sparkles size={14} color={Theme.primary} />
                    <Text style={styles.simulatorLabel}>
                      {hasHardware ? 'Or Test with Simulator:' : 'Hardware not detected. Test Tap:'}
                    </Text>
                  </View>
                  <View style={styles.simButtonsRow}>
                    <TouchableOpacity
                      style={styles.simBtn}
                      onPress={() => handleSimulatedTap('Visa Contactless')}
                    >
                      <CreditCard size={14} color="#1E3A8A" />
                      <Text style={styles.simBtnText}>Tap Visa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.simBtn, styles.simBtnMastercard]}
                      onPress={() => handleSimulatedTap('Mastercard Contactless')}
                    >
                      <CreditCard size={14} color="#C2410C" />
                      <Text style={[styles.simBtnText, { color: '#C2410C' }]}>
                        Tap Mastercard
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {modalState === 'processing' && (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={Theme.primary} />
                <Text style={styles.statusTitle}>Authorizing Contactless Payment...</Text>
                <Text style={styles.statusSubtitle}>Verifying card with POS terminal</Text>
              </View>
            )}

            {modalState === 'success' && paymentResult && (
              <View style={styles.centerBox}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={48} color="#16a34a" />
                </View>
                <Text style={styles.successTitle}>Tap Approved!</Text>
                <Text style={styles.successSubtitle}>
                  {paymentResult.cardBrand || 'Contactless Card'} •••• {paymentResult.lastFour}
                </Text>
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptRef}>Ref: {paymentResult.reference}</Text>
                  {paymentResult.authCode && (
                    <Text style={styles.receiptRef}>Auth: {paymentResult.authCode}</Text>
                  )}
                  {paymentResult.isSimulated && (
                    <Text style={styles.simulatedBadge}>Test Mode / Verified</Text>
                  )}
                </View>
              </View>
            )}

            {modalState === 'error' && (
              <View style={styles.centerBox}>
                <View style={styles.errorIconCircle}>
                  <AlertCircle size={48} color="#dc2626" />
                </View>
                <Text style={styles.errorTitle}>Card Read Failed</Text>
                <Text style={styles.errorSubtitle}>
                  {errorMessage || 'Could not communicate with contactless card.'}
                </Text>

                <TouchableOpacity style={styles.retryBtn} onPress={startNfcWorkflow}>
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.gray200,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.foreground,
  },
  closeBtn: {
    padding: 4,
  },
  amountCard: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#166534',
    marginTop: 2,
  },
  body: {
    padding: 24,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningContainer: {
    alignItems: 'center',
    width: '100%',
  },
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
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  instructionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.foreground,
    textAlign: 'center',
  },
  instructionSubtitle: {
    fontSize: 13,
    color: Theme.gray500,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  simulatorBox: {
    marginTop: 24,
    width: '100%',
    padding: 12,
    backgroundColor: Theme.gray50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.gray200,
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  simulatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.gray700,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
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
  simBtnMastercard: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  simBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.foreground,
    marginTop: 16,
  },
  statusSubtitle: {
    fontSize: 13,
    color: Theme.gray500,
    marginTop: 4,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.gray700,
    marginTop: 4,
  },
  receiptDetails: {
    marginTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  receiptRef: {
    fontSize: 11,
    color: Theme.gray500,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  simulatedBadge: {
    marginTop: 6,
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
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorSubtitle: {
    fontSize: 13,
    color: Theme.gray500,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: Theme.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.gray200,
    backgroundColor: Theme.gray50,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.gray600,
  },
});
