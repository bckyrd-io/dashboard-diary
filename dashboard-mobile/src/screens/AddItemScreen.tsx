import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Package, ImagePlus, Trash2, Check, Search, Plus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
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
}

export default function AddItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopOrTablet = windowWidth >= 768;
  const existingItem = (route.params as { item?: Item })?.item;

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [name, setName] = useState(existingItem?.name || '');
  const [subCategory, setSubCategory] = useState(existingItem?.subCategory || '');
  const [barcode, setBarcode] = useState(existingItem?.barcode || '');
  const [sku, setSku] = useState(existingItem?.sku || '');
  const [price, setPrice] = useState(existingItem?.price?.toString() || '');
  const [costPrice, setCostPrice] = useState(existingItem?.costPrice?.toString() || '');
  const [quantity, setQuantity] = useState(existingItem?.quantity?.toString() || '0');
  const [unit, setUnit] = useState(existingItem?.unit || 'pairs');
  const [reorderThreshold, setReorderThreshold] = useState(existingItem?.reorderThreshold?.toString() || '');
  const [imageUrl, setImageUrl] = useState<string | null>(existingItem?.imageUrl || null);

  // Dynamic categories loaded from the catalog, so newly created categories appear too
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const isEditing = !!existingItem;

  const fetchCategories = useCallback(async () => {
    try {
      // Persisted catalog is the source of truth; items' subCategory is only a fallback
      const result = await api.get<{ success: boolean; categories: { name: string }[] }>('/api/categories');
      const cats: string[] = result.success
        ? result.categories.map((c) => c.name)
        : [];

      if (cats.length === 0) {
        const fallback = await api.get<{ success: boolean; items: Item[] }>('/api/items');
        if (fallback.success) {
          cats.push(
            ...Array.from(
              new Set(
                fallback.items
                  .map((item) => item.subCategory || null)
                  .filter((c): c is string => Boolean(c && c.trim()))
              )
            )
          );
        }
      }

      // The item being edited is always selectable even if unseen in the list
      if (existingItem?.subCategory && !cats.includes(existingItem.subCategory)) {
        cats.push(existingItem.subCategory);
      }
      setCategoryOptions(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [existingItem?.subCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reload category options when returning to this screen so a just-created
  // category from the Items context is still available
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  const pickImage = async (mode: 'gallery' | 'camera') => {
    if (imageLoading) return;

    // Permission request
    const isCamera = mode === 'camera';
    const permissionFn = isCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const permission = await permissionFn();
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        isCamera
          ? 'Please allow camera access to take a product photo.'
          : 'Please allow photo library access to select a product image.'
      );
      return;
    }

    try {
      setImageLoading(true);
      const options = {
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        allowsEditing: true,
        aspect: [4, 3] as [number, number],
        quality: 0.8,
      };
      const result = isCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || result.assets.length === 0) return;

      // Compress & downscale to keep the base64 payload small (stays under ~200KB)
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipulated.base64) {
        setImageUrl(`data:image/jpeg;base64,${manipulated.base64}`);
      } else {
        Alert.alert('Error', 'Failed to process the selected image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleImagePress = () => {
    Alert.alert('Product Image', imageUrl ? 'Replace or remove the product image' : 'Add a product image', [
      { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      ...(imageUrl ? [{ text: 'Remove Image', style: 'destructive' as const, onPress: () => setImageUrl(null) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleAddNewCategory = async (value?: string) => {
    const name = (value ?? categorySearch).trim();
    if (!name) {
      Alert.alert('Error', 'Enter a category name');
      return;
    }

    // Persist the category in the DB immediately so it's available for future items,
    // even if this item is never saved (POST is idempotent for existing names)
    setLoading(true);
    try {
      const result = await api.post<{ success: boolean; category?: { name: string } }>('/api/categories', { name });
      if (!result.success) throw new Error('Failed to save category');
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save the new category');
      setLoading(false);
      return;
    }
    setLoading(false);

    setSubCategory(name);
    setCategoryOptions((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCategorySearch('');
    setCategoryDropdownOpen(false);
  };

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
        // Explicit null lets the API clear the stored image when removed while editing
        imageUrl: imageUrl ?? (isEditing ? null : undefined),
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

  const selectCategory = (cat: string) => {
    setSubCategory(cat);
    setCategorySearch('');
    setCategoryDropdownOpen(false);
  };

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoryOptions;
    return categoryOptions.filter((c) => c.toLowerCase().includes(q));
  }, [categoryOptions, categorySearch]);

  // The search box doubles as the new-category input: when what's typed doesn't
  // exactly match an existing option, offer creating it (no modal needed)
  const canCreateNewCategory = useMemo(() => {
    const q = categorySearch.trim();
    if (!q) return false;
    return !categoryOptions.some((c) => c.toLowerCase() === q.toLowerCase());
  }, [categoryOptions, categorySearch]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isEditing ? 'Edit Item' : 'Add Item'}
        back={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={[styles.content, styles.formShell, { width: isDesktopOrTablet ? '70%' : '100%' }]}>
        {/* Product Image Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Product Image</Text>
          <TouchableOpacity style={styles.imagePickerBox} onPress={handleImagePress} activeOpacity={0.7}>
            {imageLoading ? (
              <ActivityIndicator size="large" color={Theme.primary} />
            ) : imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePickerEmpty}>
                <ImagePlus size={30} color={Theme.gray400} />
                <Text style={styles.imagePickerHint}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>Gallery or camera · compressed automatically</Text>
        </View>

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

        {/* Category — inline searchable dropdown (same pattern as the
            Performance screen's Assign Activity input, no modal) */}
        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setCategoryDropdownOpen((v) => !v)}
            activeOpacity={0.7}
          >
            <Search size={16} color={Theme.mutedForeground} />
            <Text
              style={[
                styles.dropdownTriggerText,
                subCategory && styles.dropdownTriggerSelected,
              ]}
              numberOfLines={1}
            >
              {subCategory || 'Search categories or type to add one...'}
            </Text>
            {subCategory ? (
              <TouchableOpacity
                onPress={() => setSubCategory('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={Theme.mutedForeground} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>

          {categoryDropdownOpen ? (
            <View style={styles.dropdownPanel}>
              <TextInput
                style={styles.searchInput}
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="Type to filter..."
                placeholderTextColor={Theme.mutedForeground}
                autoFocus
              />
              <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item}
                style={{ maxHeight: 180 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.emptyOptions}>No matching categories</Text>
                }
                renderItem={({ item: cat }) => {
                  const isSelected = subCategory === cat;
                  return (
                    <TouchableOpacity
                      style={[styles.optionRow, isSelected && styles.optionRowActive]}
                      onPress={() => selectCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                      {isSelected ? <Check size={16} color={Theme.primary} /> : null}
                    </TouchableOpacity>
                  );
                }}
              />
              {canCreateNewCategory ? (
                <TouchableOpacity
                  style={styles.createCategoryRow}
                  onPress={() => handleAddNewCategory()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Theme.primary} />
                  ) : (
                    <Plus size={14} color={Theme.primary} />
                  )}
                  <Text style={styles.createCategoryText}>
                    Create "{categorySearch.trim()}" as new category
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          <Text style={styles.hint}>
            Search and pick a category, or type a new name to create one
          </Text>
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
  content: { padding: 16, paddingBottom: 40 },
  formShell: { alignSelf: 'center' },
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
  imagePickerBox: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    backgroundColor: Theme.muted,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePickerEmpty: { justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePickerHint: { fontSize: 13, color: Theme.gray500 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    backgroundColor: Theme.muted,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dropdownTriggerText: { flex: 1, fontSize: 15, color: Theme.mutedForeground },
  dropdownTriggerSelected: { color: Theme.foreground, fontWeight: '600' },
  dropdownPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius,
    backgroundColor: Theme.background,
    overflow: 'hidden',
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.foreground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  optionRowActive: { backgroundColor: Theme.primaryLight },
  optionLabel: { fontSize: 14, color: Theme.foreground, fontWeight: '500' },
  optionLabelSelected: { color: Theme.primary, fontWeight: '600' },
  emptyOptions: { padding: 14, fontSize: 13, color: Theme.mutedForeground, textAlign: 'center' },
  createCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Theme.muted,
  },
  createCategoryText: { color: Theme.primary, fontWeight: '600', fontSize: 14 },
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
