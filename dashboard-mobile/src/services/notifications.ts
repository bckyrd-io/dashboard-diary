import { Platform } from 'react-native';

/**
 * Local notifications only (Expo Go compatible).
 *
 * We intentionally deep-import the local-notification APIs instead of the
 * package root (`expo-notifications`). The root module registers push-token
 * auto-registration side effects (`DevicePushTokenAutoRegistration.fx`) which
 * call `warnOfExpoGoPushUsage()` and THROW on Android inside Expo Go (SDK 53+),
 * breaking `scheduleNotificationAsync` with "undefined is not a function".
 *
 * Local notifications remain fully supported in Expo Go — only remote/push
 * notifications were removed.
 */

type ScheduleRequest = {
  content: { title: string; body: string; data?: Record<string, any>; sound?: boolean };
  trigger: { type: 'timeInterval'; seconds: number; repeats?: boolean } | null;
};

type LocalNotificationsModule = {
  scheduleNotificationAsync: (request: ScheduleRequest) => Promise<string>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert?: boolean;
      shouldPlaySound?: boolean;
      shouldSetBadge?: boolean;
      shouldShowBanner?: boolean;
      shouldShowList?: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  setNotificationChannelAsync: (
    id: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern?: number[];
      lightColor?: string;
      sound?: string;
    }
  ) => Promise<unknown>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  AndroidImportance: { MAX: number };
};

let modulePromise: Promise<LocalNotificationsModule | null> | null = null;
let handlerConfigured = false;
let initialized = false;

function loadNotifications(): Promise<LocalNotificationsModule | null> {
  if (!modulePromise) {
    modulePromise = (async () => {
      try {
        const [scheduler, handler, permissions, channel, cancel, channelTypes] =
          await Promise.all([
            import('expo-notifications/build/scheduleNotificationAsync'),
            import('expo-notifications/build/NotificationsHandler'),
            import('expo-notifications/build/NotificationPermissions'),
            import('expo-notifications/build/setNotificationChannelAsync'),
            import('expo-notifications/build/cancelAllScheduledNotificationsAsync'),
            import('expo-notifications/build/NotificationChannelManager.types'),
          ]);

        const module: LocalNotificationsModule = {
          scheduleNotificationAsync: scheduler.scheduleNotificationAsync as any,
          setNotificationHandler: handler.setNotificationHandler as any,
          getPermissionsAsync: permissions.getPermissionsAsync as any,
          requestPermissionsAsync: permissions.requestPermissionsAsync as any,
          setNotificationChannelAsync: channel.setNotificationChannelAsync as any,
          cancelAllScheduledNotificationsAsync:
            cancel.cancelAllScheduledNotificationsAsync as any,
          AndroidImportance: channelTypes.AndroidImportance as any,
        };

        configureNotificationHandler(module);
        return module;
      } catch {
        return null;
      }
    })();
    modulePromise.catch(() => {
      modulePromise = null;
    });
  }
  return modulePromise;
}

function configureNotificationHandler(module: LocalNotificationsModule) {
  if (handlerConfigured || Platform.OS === 'web') return;
  try {
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  } catch {
    // Safe no-op if the native module is unavailable.
  }
}

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
  if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') {
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
      trigger: null, // immediate local trigger
    });
    return id;
  } catch (error) {
    console.warn('Local notification not delivered (non-fatal):', error);
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
  if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') {
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
      trigger: {
        type: 'timeInterval',
        seconds: Math.max(1, secondsFromNow),
      },
    });
    return id;
  } catch (error) {
    console.warn('Local notification not scheduled (non-fatal):', error);
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
  } catch {
    // Non-fatal.
  }
}
