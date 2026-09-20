import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure foreground notification behavior on native platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Initialize local notification settings, permissions, and Android channels.
 */
export async function initNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch {
        // Safe no-op if blocked in iframe/browser
      }
    }
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00CC6A',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

/**
 * Trigger an immediate local notification on device.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
        return 'web-notif';
      } catch {
        // fallback
      }
    }
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // immediate trigger
    });
    return id;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return null;
  }
}

/**
 * Schedule a local notification after a given number of seconds.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  data?: Record<string, any>
): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (secondsFromNow > 0) {
      setTimeout(() => {
        sendLocalNotification(title, body, data);
      }, secondsFromNow * 1000);
    }
    return 'web-scheduled';
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsFromNow),
      },
    });
    return id;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}
