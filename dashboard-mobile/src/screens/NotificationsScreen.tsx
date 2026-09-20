import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, Check, AlertTriangle, CreditCard, Calendar, UserCheck, CheckCheck } from 'lucide-react-native';
import { api } from '../services/api';
import { Theme } from '../constants/Theme';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedEventId: number | null;
  relatedItemId: number | null;
  createdAt: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const result = await api.get<{ success: boolean; notifications: Notification[] }>(
        '/api/notifications'
      );
      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await api.post(`/api/notifications/${notification.id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle size={20} color={Theme.warning} />;
      case 'payment_status':
        return <CreditCard size={20} color={Theme.success} />;
      case 'event_reminder':
        return <Calendar size={20} color={Theme.primary} />;
      case 'assignment':
        return <UserCheck size={20} color={Theme.primary} />;
      default:
        return <Bell size={20} color={Theme.gray500} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.notificationUnread]}
      onPress={() => markAsRead(item)}
    >
      <View style={styles.iconContainer}>
        {getNotificationIcon(item.type)}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.notificationTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      {unreadCount > 0 && (
        <View style={styles.headerInfo}>
          <CheckCheck size={16} color={Theme.primary} />
          <Text style={styles.headerInfoText}>{unreadCount} unread notifications</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={Theme.gray300} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.primaryLight,
    gap: 8,
  },
  headerInfoText: { fontSize: 13, color: Theme.primary, fontWeight: '500' },
  listContent: { paddingBottom: 24 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  notificationUnread: {
    backgroundColor: Theme.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius,
    backgroundColor: Theme.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: { fontSize: 14, fontWeight: '500', color: Theme.foreground, flex: 1 },
  notificationTitleUnread: { fontWeight: '700' },
  notificationTime: { fontSize: 12, color: Theme.gray500, marginLeft: 8 },
  notificationBody: { fontSize: 13, color: Theme.gray600, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.primary,
    marginLeft: 8,
    marginTop: 6,
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
