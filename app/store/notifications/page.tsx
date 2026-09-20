"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check } from "lucide-react";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setNotifications(result.notifications);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border rounded-md transition-colors ${
                notification.isRead
                  ? "border-gray-200 bg-white"
                  : "border-blue-200 bg-blue-50/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {notification.isRead ? (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Bell className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-medium ${notification.isRead ? "" : "text-foreground"}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                    <span className="inline-block mt-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {notification.type}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border border-gray-200 rounded-md">
            <CardContent className="py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-center">No notifications</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
