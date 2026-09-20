import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Save, Package } from 'lucide-react-native';
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
}

const CATEGORIES = ['Office Shoes', 'Casual Shoes', 'Sports Shoes', 'Designer Shoes'];

export default function AddItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const existingItem = (route.params as { item?: Item })?.item;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(existingItem?.name || '');
  const [subCategory, setSubCategory] = useState(existingItem?.subCategory || '');
  const [barcode, setBarcode] = useState(existingItem?.barcode || '');
  const [sku, setSku] = useState(existingItem?.sku || '');
  const [price, setPrice] = useState(existingItem?.price?.toString() || '');
  const [costPrice, setCostPrice] = useState(existingItem?.costPrice?.toString() || '');
  const [quantity, setQuantity] = useState(existingItem?.quantity?.toString() || '0');
  const [unit, setUnit] = useState(existingItem?.unit || 'pairs');
  const [reorderThreshold, setReorderThreshold] = useState(existingItem?.reorderThreshold?.toString() || '');

  const isEditing = !!existingItem;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!price || Number(price) <= 0) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    if (!subCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...(isEditing ? { id: existingItem.id } : {}),
        name: name.trim(),
        category: 'physical-product',
        subCategory,
        barcode: barcode.trim() || undefined,
        sku: sku.trim() || undefined,
        price: Number(price),
        costPrice: costPrice ? Number(costPrice) : undefined,
        quantity: Number(quantity),
        unit: unit || undefined,
        reorderThreshold: reorderThreshold ? Number(reorderThreshold) : undefined,
      };

      if (isEditing) {
        await api.put('/api/items', payload);
        Alert.alert('Success', 'Item updated successfully');
      } else {
        await api.post('/api/items', payload);
        Alert.alert('Success', 'Item created successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={Theme.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Item' : 'Add Item'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator size="small" color={Theme.primary} />
          ) : (
            <Save size={20} color={Theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Classic Oxford Brogue"
            placeholderTextColor={Theme.gray400}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  subCategory === cat && styles.categoryOptionActive,
                ]}
                onPress={() => setSubCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    subCategory === cat && styles.categoryOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Barcode */}
        <View style={styles.field}>
          <Text style={styles.label}>Barcode</Text>
          <TextInput
            style={styles.input}
            value={barcode}
            onChangeText={setBarcode}
            placeholder="e.g. TSL-OF-001"
            placeholderTextColor={Theme.gray400}
            autoCapitalize="characters"
          />
        </View>

        {/* SKU */}
        <View style={styles.field}>
          <Text style={styles.label}>SKU</Text>
          <TextInput
            style={styles.input}
            value={sku}
            onChangeText={setSku}
            placeholder="Internal code"
            placeholderTextColor={Theme.gray400}
          />
        </View>

        {/* Price Row */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Selling Price (MWK) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor={Theme.gray400}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Cost Price (MWK)</Text>
            <TextInput
              style={styles.input}
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="0"
              placeholderTextColor={Theme.gray400}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Stock Row */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={Theme.gray400}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="pairs"
              placeholderTextColor={Theme.gray400}
            />
          </View>
        </View>

        {/* Reorder Threshold */}
        <View style={styles.field}>
          <Text style={styles.label}>Low Stock Alert Threshold</Text>
          <TextInput
            style={styles.input}
            value={reorderThreshold}
            onChangeText={setReorderThreshold}
            placeholder="e.g. 10"
            placeholderTextColor={Theme.gray400}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Get notified when stock falls below this level</Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButtonFull, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Package size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Item' : 'Add Item'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
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
  saveButton: { padding: 8 },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.gray700,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Theme.muted,
    color: Theme.foreground,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    color: Theme.gray500,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.muted,
  },
  categoryOptionActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.gray600,
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  saveButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primary,
    paddingVertical: 16,
    borderRadius: Theme.radius,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
