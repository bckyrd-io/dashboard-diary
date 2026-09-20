import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Flashlight, FlashlightOff } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';

interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  barcode: string | null;
  imageUrl: string | null;
}

export default function ScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = route.params as { mode: 'lookup' | 'checkout' };
  const { addItem } = useCart();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const result = await api.get<{ success: boolean; item: Item | null }>(
        `/api/items?search=${data}`
      );

      if (result.success && result.item) {
        // Item found
        if (mode === 'lookup') {
          navigation.goBack();
          (navigation as any).navigate('ItemDetail', { itemId: result.item.id });
        } else if (mode === 'checkout') {
          if (result.item.quantity > 0) {
            addItem({
              itemId: result.item.id,
              name: result.item.name,
              price: result.item.price,
              barcode: result.item.barcode,
              imageUrl: result.item.imageUrl,
            });
            Alert.alert('Added to Cart', `${result.item.name} added to cart.`);
            navigation.goBack();
          } else {
            Alert.alert('Out of Stock', 'This item is currently out of stock.');
            setScanned(false);
          }
        }
      } else {
        // Item not found
        Alert.alert(
          'Item Not Found',
          `No item found with barcode: ${data}`,
          [
            { text: 'Cancel', onPress: () => setScanned(false), style: 'cancel' },
            {
              text: 'Add Item',
              onPress: () => {
                navigation.goBack();
                (navigation as any).navigate('AddItem', { barcode: data });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to look up item. Please try again.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          This app needs camera access to scan barcodes.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'lookup' ? 'Scan to Lookup' : 'Scan to Add to Cart'}
          </Text>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => setFlashOn(!flashOn)}
          >
            {flashOn ? (
              <FlashlightOff size={24} color="#fff" />
            ) : (
              <Flashlight size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Scan Frame */}
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanText}>
            {loading ? 'Looking up item...' : 'Align barcode within the frame'}
          </Text>
        </View>

        {/* Bottom Hint */}
        <View style={styles.bottomHint}>
          <Text style={styles.hintText}>
            {mode === 'checkout'
              ? 'Item will be added to cart'
              : 'Item details will be displayed'}
          </Text>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  flashButton: { padding: 8 },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Theme.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: Theme.radius,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: Theme.radius,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: Theme.radius,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: Theme.radius,
  },
  scanText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
  },
  bottomHint: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  hintText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  loadingText: { marginTop: 12, color: Theme.gray500 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Theme.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.foreground,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: Theme.gray500,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.radius,
    marginBottom: 12,
  },
  permissionButtonText: { color: '#fff', fontWeight: '600' },
  cancelButton: { padding: 12 },
  cancelButtonText: { color: Theme.gray500 },
});
