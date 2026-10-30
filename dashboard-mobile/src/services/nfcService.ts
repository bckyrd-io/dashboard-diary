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

  async readProductTag(): Promise<ProductTagResult> {
    const isReady = await this.isSupported();
    if (!isReady || !NfcManager) {
      return {
        success: false,
        error:
          'NFC scan is not available in this app environment. The native NFC module is not loaded here (common in Expo Go / web / non-native builds), so no scan was registered.',
      };
    }

    try {
      await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA]);
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
