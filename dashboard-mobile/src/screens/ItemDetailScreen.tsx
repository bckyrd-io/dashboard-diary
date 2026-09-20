import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Package, Edit, Trash2, Barcode, DollarSign, Hash, Tag, AlertTriangle } from 'lucide-react-native';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';

interface Item {
  id: number;
  name: string;
  category: string;
  subCategory: string | null;
  barcode: string | null;
  sku: string | null;
  price: number;
  costPrice: number | null;
  quantity: number;
  unit: string | null;
  reorderThreshold: number | null;
  imageUrl: string | null;
  branchId: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { itemId } = route.params as { itemId: number };

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const result = await api.get<{ success: boolean; item: Item }>(`/api/items/${itemId}`);
      if (result.success) {
        setItem(result.item);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('Error', 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/items/${itemId}`);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`;
  };

  const getStockStatus = () => {
    if (!item) return { label: 'Unknown', color: Theme.gray500, bg: Theme.muted };
    if (item.quantity === 0) return { label: 'Out of Stock', color: Theme.error, bg: Theme.errorLight };
    if (item.reorderThreshold && item.quantity <= item.reorderThreshold) {
      return { label: 'Low Stock', color: Theme.warning, bg: Theme.warningLight };
    }
    return { label: 'In Stock', color: Theme.success, bg: Theme.successLight };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={Theme.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate('AddItem', { item })}
          >
            <Edit size={20} color={Theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Trash2 size={20} color={Theme.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Package size={64} color={Theme.gray300} />
          </View>
        )}

        {/* Name and Price */}
        <View style={styles.titleSection}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {stockStatus.label} ({item.quantity} {item.unit || 'units'})
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Product Information</Text>

          <View style={styles.detailRow}>
            <Tag size={18} color={Theme.gray500} />
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{item.subCategory || item.category}</Text>
          </View>

          {item.barcode && (
            <View style={styles.detailRow}>
              <Barcode size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Barcode</Text>
              <Text style={styles.detailValue}>{item.barcode}</Text>
            </View>
          )}

          {item.sku && (
            <View style={styles.detailRow}>
              <Hash size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>SKU</Text>
              <Text style={styles.detailValue}>{item.sku}</Text>
            </View>
          )}

          {item.costPrice && (
            <View style={styles.detailRow}>
              <DollarSign size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Cost Price</Text>
              <Text style={styles.detailValue}>{formatPrice(item.costPrice)}</Text>
            </View>
          )}

          {item.reorderThreshold && (
            <View style={styles.detailRow}>
              <AlertTriangle size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Reorder At</Text>
              <Text style={styles.detailValue}>{item.reorderThreshold} units</Text>
            </View>
          )}
        </View>

        {/* Stock Info */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.stockInfo}>
            <View style={styles.stockStat}>
              <Text style={styles.stockStatValue}>{item.quantity}</Text>
              <Text style={styles.stockStatLabel}>Current Stock</Text>
            </View>
            <View style={styles.stockStat}>
              <Text style={styles.stockStatValue}>{item.reorderThreshold || 'N/A'}</Text>
              <Text style={styles.stockStatLabel}>Reorder Point</Text>
            </View>
          </View>
        </View>
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
  headerActions: { flexDirection: 'row', gap: 12 },
  headerButton: { padding: 8 },
  content: { paddingBottom: 24 },
  itemImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: Theme.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  itemName: { fontSize: 22, fontWeight: '700', color: Theme.foreground, marginBottom: 8 },
  itemPrice: { fontSize: 24, fontWeight: '700', color: Theme.primary, marginBottom: 12 },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius,
    alignSelf: 'flex-start',
  },
  stockText: { fontSize: 13, fontWeight: '600' },
  detailsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Theme.background,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.foreground,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  detailLabel: { flex: 1, marginLeft: 12, fontSize: 14, color: Theme.gray500 },
  detailValue: { fontSize: 14, fontWeight: '500', color: Theme.foreground },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  stockStat: { alignItems: 'center' },
  stockStatValue: { fontSize: 24, fontWeight: '700', color: Theme.primary },
  stockStatLabel: { fontSize: 12, color: Theme.gray500, marginTop: 4 },
});
