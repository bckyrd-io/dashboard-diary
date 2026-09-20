"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";

interface Event {
  id: number;
  eventType: string;
  amount: number;
  date: string;
}

interface Item {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export default function ReportsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/events"), fetch("/api/items")])
      .then(async ([eventsRes, itemsRes]) => {
        const eventsData = await eventsRes.json();
        const itemsData = await itemsRes.json();
        if (eventsData.success) setEvents(eventsData.events);
        if (itemsData.success) setItems(itemsData.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const salesEvents = events.filter((e) => e.eventType === "sale");
  const totalSales = salesEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalItems = items.length;
  const totalStockValue = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);

  const revenueByCategory = items.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += (item.price || 0) * (item.quantity || 0);
    return acc;
  }, {} as Record<string, number>);

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Business overview and summaries</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-gray-200 rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalSales)}</div>
            <p className="text-xs text-muted-foreground">{salesEvents.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">in inventory</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalStockValue)}</div>
            <p className="text-xs text-muted-foreground">total inventory value</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Category */}
      <Card className="border border-gray-200 rounded-md">
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(revenueByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(revenueByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, value]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">{formatPrice(value)}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No category data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
