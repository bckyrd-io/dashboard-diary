import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule | null> | null = null;
let handlerConfigured = false;
let initialized = false;

/**
 * Lazily loads expo-notifications. The module is imported only when a local
 * notification is actually triggered, never at app startup, so its module-level
 * Expo Go / push-token side effects never run on launch.
 */
function loadNotifications(): Promise<NotificationsModule | null> {
  if (!modulePromise) {
    modulePromise = import('expo-notifications').then(
      (module) => {
        configureNotificationHandler(module);
        return module;
      },
      () => null
    );
    // If the dynamic import fails, allow a retry on the next call.
    modulePromise.catch(() => {
      modulePromise = null;
    });
  }
  return modulePromise;
}

function configureNotificationHandler(module: NotificationsModule) {
  if (handlerConfigured || Platform.OS === 'web') return;
  try {
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  } catch {
    // Safe no-op if the native module is unavailable.
  }
}

/**
 * Ensure local notification permissions are granted and the Android channel
 * exists. Runs once, lazily, right before the first notification is sent so
 * permissions are only ever requested when the feature is actually used.
 */
async function ensureInitialized(): Promise<void> {
  if (initialized || Platform.OS === 'web') return;

  const Notifications = await loadNotifications();
  if (!Notifications) return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted' && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00CC6A',
        sound: 'default',
      });
    }

    initialized = true;
  } catch {
    // Permission or channel setup failed; scheduling below still attempts.
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

  await ensureInitialized();
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

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

  await ensureInitialized();
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

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
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}