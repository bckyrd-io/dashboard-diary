"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, ArrowRightLeft, Package } from "lucide-react";

interface Event {
  id: number;
  eventType: string;
  description: string;
  amount: number;
  date: string;
  paymentStatus: string | null;
  financialType: string | null;
}

const EVENT_TYPES = ["All", "sale", "transfer", "receiving"];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setEvents(result.events);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? events : events.filter((e) => e.eventType === filter);

  const formatPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "sale":
        return <Badge variant="default">Sale</Badge>;
      case "transfer":
        return <Badge variant="secondary">Transfer</Badge>;
      case "receiving":
        return <Badge variant="outline">Receiving</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPaymentBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground text-sm">-</span>;
    if (status === "paid") return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Paid</Badge>;
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    return <Badge variant="outline">{status}</Badge>;
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
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground">Track sales, transfers, and inventory movements</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {EVENT_TYPES.map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(type)}
            className="capitalize"
          >
            {type}
          </Button>
        ))}
      </div>

      <Card className="border border-gray-200 rounded-md">
        <CardHeader>
          <CardTitle>Events ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">{getEventBadge(event.eventType)}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{event.description || "-"}</td>
                      <td className="py-3 px-4 font-medium">{formatPrice(event.amount)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(event.date)}</td>
                      <td className="py-3 px-4">{getPaymentBadge(event.paymentStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No events found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
