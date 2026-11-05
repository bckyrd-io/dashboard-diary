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
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Package, Edit, Trash2, Barcode, DollarSign, Hash, Tag, RotateCcw } from 'lucide-react-native';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';
import { ScreenHeader } from '../components/ui';

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
  branchCount?: number;
  branchIds?: number[];
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopOrTablet = windowWidth >= 768;
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

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Item Details"
        back={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ width: isDesktopOrTablet ? '70%' : '100%', alignSelf: 'center' }}>
          {/* Image */}
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={64} color={Theme.gray300} />
            </View>
          )}

          {/* Name and Price — name/image are the detail view's own presentation */}
          <View style={styles.titleSection}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
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

            <View style={styles.detailRow}>
              <Package size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>{item.quantity}</Text>
            </View>

            <View style={styles.detailRow}>
              <RotateCcw size={18} color={Theme.gray500} />
              <Text style={styles.detailLabel}>Reorder Threshold</Text>
              <Text style={styles.detailValue}>{item.reorderThreshold ?? 'N/A'}</Text>
            </View>
          </View>

          {/* Actions — below the details card instead of in the header */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => (navigation as any).navigate('AddItem', { item })}
              activeOpacity={0.7}
            >
              <Edit size={18} color={Theme.primary} />
              <Text style={styles.editButtonText}>Edit Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={Theme.destructive} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Theme.radius,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: Theme.primaryLight,
    borderColor: Theme.primary,
  },
  editButtonText: { color: Theme.primary, fontSize: 15, fontWeight: '600' },
  deleteButton: {
    backgroundColor: Theme.errorLight,
    borderColor: Theme.error,
  },
  deleteButtonText: { color: Theme.destructive, fontSize: 15, fontWeight: '600' },
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
});
