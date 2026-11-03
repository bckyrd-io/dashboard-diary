import { Platform } from 'react-native';

let NfcManager: any = null;
let NfcTech: any = null;

try {
  const nfcModule = require('react-native-nfc-manager');
  NfcManager = nfcModule.default || nfcModule;
  NfcTech = nfcModule.NfcTech;
} catch (e) {
  // Native NFC module not available (Expo Go / not linked).
}

export interface ProductTagResult {
  success: boolean;
  tagId?: string;
  payload?: string;
  error?: string;
}

class NfcService {
  private initialized = false;
  private initFailed = false;

  async init(): Promise<boolean> {
    if (this.initialized) return true;
    if (this.initFailed) return false;
    if (Platform.OS === 'web' || !NfcManager) {
      this.initFailed = true;
      return false;
    }
    try {
      await NfcManager.start();
      this.initialized = true;
      return true;
    } catch (err) {
      // NFC native start fails in Expo Go / without NFC permission.
      this.initFailed = true;
      return false;
    }
  }

  async isSupported(): Promise<boolean> {
    if (Platform.OS === 'web' || !NfcManager) return false;
    try {
      await this.init();
      return await NfcManager.isSupported();
    } catch {
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    if (Platform.OS === 'web' || !NfcManager) return false;
    try {
      await this.init();
      return await NfcManager.isEnabled();
    } catch {
      return false;
    }
  }

  async openSettings(): Promise<void> {
    if (NfcManager && NfcManager.goToNfcSetting) {
      await NfcManager.goToNfcSetting();
    }
  }

  async readProductTag(timeoutMs = 12000): Promise<ProductTagResult> {
    const isReady = await this.isSupported();
    if (!isReady || !NfcManager) {
      return {
        success: false,
        error:
          'NFC scan is not available in this app environment. The native NFC module is not loaded here (common in Expo Go / web / non-native builds), so no scan was registered.',
      };
    }

    // NFC switched off would otherwise spin forever waiting for a tag.
    const enabled = await this.isEnabled();
    if (!enabled) {
      return {
        success: false,
        error: 'NFC is turned off. Enable NFC in your device settings and try again.',
      };
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    try {
      const request = NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA]);
      // If the timeout wins and we cancel the session, this promise rejects —
      // swallow it so it never surfaces as an unhandled rejection.
      request.catch(() => undefined);

      // No tag presented (or NFC unavailable at the OS level) must not hang
      // the spinner — race the request against a timeout and cancel cleanly.
      const raced = await Promise.race([
        request.then(() => 'ok' as const),
        new Promise<'timeout'>((resolve) => {
          timeoutHandle = setTimeout(() => resolve('timeout'), timeoutMs);
        }),
      ]);

      if (raced === 'timeout') {
        return {
          success: false,
          error: 'No NFC tag detected. Please try again later.',
        };
      }

      const tag = await NfcManager.getTag();
      const tagId = tag?.id ? String(tag.id).trim() : '';
      const payload = tag?.ndefMessage ? JSON.stringify(tag.ndefMessage) : undefined;

      if (!tagId && !payload) {
        return {
          success: false,
          error: 'No NFC tag data was detected. No check-in was recorded.',
        };
      }

      try {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      return {
        success: true,
        tagId: tagId || undefined,
        payload,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to read product tag.',
      };
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      // Cancel the pending requestTechnology too — it resolves via the
      // catch path in the library once cancelled, which is harmless here.
      this.cancelSession();
    }
  }

  async cancelSession(): Promise<void> {
    if (NfcManager) {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  }
}

export const nfcService = new NfcService();
