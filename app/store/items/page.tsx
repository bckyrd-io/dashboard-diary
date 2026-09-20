"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Tag, Package, AlertTriangle } from "lucide-react";
import Link from "next/link";

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

const CATEGORIES = ["All", "Office Shoes", "Casual Shoes", "Sports Shoes", "Designer Shoes"];

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") {
        params.append("sub_category", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const queryString = params.toString();
      const url = `/api/items${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setItems(result.items);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, searchQuery]);

  const getStockStatus = (item: Item) => {
    if (item.quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (item.reorderThreshold && item.quantity <= item.reorderThreshold) {
      return { label: "Low Stock", variant: "secondary" as const };
    }
    return { label: "In Stock", variant: "default" as const };
  };

  const formatPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Items</h1>
          <p className="text-muted-foreground">Manage your shoe inventory</p>
        </div>
        <Link href="/store/items/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shoes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const stockStatus = getStockStatus(item);
          return (
            <Link key={item.id} href={`/store/items/${item.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                {item.imageUrl ? (
                  <div className="aspect-square relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center rounded-t-lg">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.subCategory || item.category}
                  </p>
                  <p className="text-lg font-bold text-primary mb-2">
                    {formatPrice(item.price)}
                  </p>
                  <Badge variant={stockStatus.variant}>
                    {stockStatus.label} ({item.quantity})
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No items found</p>
        </div>
      )}
    </div>
  );
}
