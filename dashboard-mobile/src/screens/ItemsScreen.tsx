import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search, Plus, Tag, Package, ScanBarcode, ShoppingCart, Check } from 'lucide-react-native';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';
import { useCart } from '../context/CartContext';

interface Item {
  id: number;
  name: string;
  category: string;
  subCategory: string | null;
  barcode: string | null;
  sku: string | null;
  price: number;
  costPrice: number | null;
  quantity: number; // total stock across all branch copies of this product
  unit: string | null;
  reorderThreshold: number | null;
  imageUrl: string | null;
  branchId: number | null;
  branchCount?: number; // how many branches stock this product
}

export default function ItemsScreen() {
  const navigation = useNavigation();
  const { addItem, items: cartItems } = useCart();
  const { width: windowWidth } = useWindowDimensions();

  const [items, setItems] = useState<Item[]>([]);
  // Categories are fully dynamic: chips come from the persisted catalog, with
  // items' subCategory used only as an offline/error fallback. No hardcoded rows.
  const [categories, setCategories] = useState<string[]>(['All']);
  const categoriesFromApi = useRef(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Responsive column calculation based on viewport width
  const numColumns = useMemo(() => {
    if (windowWidth >= 1280) return 5;
    if (windowWidth >= 992) return 4;
    if (windowWidth >= 640) return 3;
    return 2;
  }, [windowWidth]);

  const cardGap = 12;
  const horizontalPadding = 32; // 16px left + 16px right
  const cardWidth = useMemo(() => {
    return Math.floor((windowWidth - horizontalPadding - (numColumns - 1) * cardGap) / numColumns);
  }, [windowWidth, numColumns]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory.toLowerCase() !== 'all') {
        params.append('sub_category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const queryString = params.toString();
      const url = `/api/items${queryString ? `?${queryString}` : ''}`;

      const result = await api.get<{ success: boolean; items: Item[] }>(url);
      if (result.success) {
        setItems(result.items);

        // Fallback: derive categories from items only if the persisted
        // catalog fetch failed (keeps chips usable offline / on API errors)
        if (
          !categoriesFromApi.current &&
          selectedCategory.toLowerCase() === 'all' &&
          !searchQuery
        ) {
          const dynamicCats = Array.from(
            new Set(
              result.items
                .map((i) => i.subCategory || i.category)
                .filter((c): c is string => Boolean(c && c.trim()))
            )
          );
          if (dynamicCats.length > 0) {
            setCategories(['All', ...dynamicCats]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await api.get<{ success: boolean; categories: { name: string }[] }>(
        '/api/categories'
      );
      if (result.success) {
        // Persisted catalog is the source of truth — applied even when empty
        // so stale/hardcoded chips never linger after a data reset.
        setCategories(['All', ...result.categories.map((c) => c.name)]);
        categoriesFromApi.current = true;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
      fetchCategories();
    }, [selectedCategory, searchQuery])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const getStockStatus = (item: Item) => {
    if (item.quantity === 0) return { label: 'Out of Stock', color: Theme.error, bg: Theme.errorLight };
    if (item.reorderThreshold && item.quantity <= item.reorderThreshold) {
      return { label: 'Low Stock', color: Theme.warning, bg: Theme.warningLight };
    }
    return { label: 'In Stock', color: Theme.success, bg: Theme.successLight };
  };

  const formatPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`;
  };

  // How many of this product are already sitting in the cart
  const inCartQty = (itemId: number) =>
    cartItems.find((c) => c.itemId === itemId)?.quantity ?? 0;

  // The bottom section of the card adds to cart (no navigation) — checkout
  // happens from the drawer menu when the customer's cart is ready.
  const handleAddToCart = (item: Item) => {
    const already = inCartQty(item.id);
    if (item.quantity <= 0 || already + 1 > item.quantity) {
      Alert.alert(
        'Out of Stock',
        item.quantity <= 0
          ? `"${item.name}" is out of stock.`
          : `Only ${item.quantity} of "${item.name}" available.`
      );
      return;
    }
    addItem(
      {
        itemId: item.id,
        name: item.name,
        price: item.price,
        barcode: item.barcode,
        imageUrl: item.imageUrl,
      },
      1
    );
  };

  const openDetail = (item: Item) => {
    (navigation as any).navigate('ItemDetail', { itemId: item.id });
  };

  const renderItem = ({ item }: { item: Item }) => {
    const stockStatus = getStockStatus(item);
    const added = inCartQty(item.id);

    return (
      <View style={[styles.itemCard, { width: cardWidth }]}>
        {/* Photo → item details */}
        <TouchableOpacity
          style={styles.imageWrapper}
          onPress={() => openDetail(item)}
          activeOpacity={0.8}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Package size={32} color={Theme.gray400} />
            </View>
          )}
        </TouchableOpacity>

        {/* Name/category → item details */}
        <TouchableOpacity
          style={styles.itemInfo}
          onPress={() => openDetail(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.subCategory || item.category}</Text>
        </TouchableOpacity>

        {/* Price row → bottom of card: one big add-to-cart zone */}
        <TouchableOpacity
          style={styles.addZone}
          onPress={() => handleAddToCart(item)}
          activeOpacity={0.8}
        >
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            <View style={[styles.quickAddBadge, added > 0 && styles.quickAddBadgeActive]}>
              {added > 0 ? (
                <Check size={12} color="#fff" />
              ) : (
                <ShoppingCart size={12} color={Theme.primary} />
              )}
              {added > 0 && <Text style={styles.quickAddCount}>{added}</Text>}
            </View>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {stockStatus.label} ({item.quantity})
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Action Bar: Search, Scan, Add */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, showSearch && styles.actionButtonActive]}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Search size={20} color={showSearch ? '#fff' : Theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => (navigation as any).navigate('Scanner', { mode: 'checkout' })}
        >
          <ScanBarcode size={20} color={Theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => (navigation as any).navigate('AddItem')}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Input (toggleable) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={18} color={Theme.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shoes by name..."
            placeholderTextColor={Theme.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Dynamic Category Filter Chips */}
      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryContainer}
          renderItem={({ item: category }) => {
            const isActive = selectedCategory.trim().toLowerCase() === category.trim().toLowerCase();
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Responsive Items Grid */}
      <FlatList
        key={`grid-${numColumns}`}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={[styles.gridRow, { gap: cardGap }]}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Tag size={48} color={Theme.gray300} />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius,
    backgroundColor: Theme.primaryLight,
    borderWidth: 1,
    borderColor: Theme.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  addButton: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.muted,
    borderRadius: Theme.radius,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: Theme.foreground,
    fontSize: 14,
  },
  categoryWrapper: {
    paddingVertical: 10,
  },
  categoryContainer: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Theme.muted,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  categoryChipActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.gray600,
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  gridRow: {
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: Theme.background,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.border,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: Theme.muted,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  addZone: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.foreground,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
    color: Theme.gray500,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.primary,
  },
  quickAddBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    borderRadius: 11,
    backgroundColor: Theme.primaryLight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  quickAddBadgeActive: {
    backgroundColor: Theme.success,
  },
  quickAddCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Theme.gray500,
    marginTop: 12,
  },
});
