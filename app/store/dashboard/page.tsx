"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";

interface DashboardData {
  totalSales: number;
  totalItems: number;
  lowStockCount: number;
  recentSales: Array<{
    id: number;
    description: string;
    amount: number;
    date: string;
    eventType: string;
  }>;
}

export default function StoreDashboard() {
  const [data, setData] = useState<DashboardData>({
    totalSales: 0,
    totalItems: 0,
    lowStockCount: 0,
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch items count
      const itemsRes = await fetch("/api/items");
      const itemsData = await itemsRes.json();

      // Fetch events
      const eventsRes = await fetch("/api/events?event_type=sale");
      const eventsData = await eventsRes.json();

      const items = itemsData.items || [];
      const sales = eventsData.events || [];

      const totalSales = sales.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const lowStockCount = items.filter(
        (i: any) => i.reorderThreshold && i.quantity <= i.reorderThreshold
      ).length;

      setData({
        totalSales,
        totalItems: items.length,
        lowStockCount,
        recentSales: sales.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">The Sneaker Lounge Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data.totalSales)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{data.lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recentSales.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentSales.length > 0 ? (
            <div className="space-y-4">
              {data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{sale.description}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(sale.date)}</p>
                  </div>
                  <p className="font-semibold text-primary">{formatPrice(sale.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent sales</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
