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
      await new Promise((resolve) => setTimeout(resolve, 600));
      try {
        // Haptics are optional; ignore failures.
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const tagId = `TAG-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
      return {
        success: true,
        tagId,
        payload: JSON.stringify({ mock: true, tagId, source: 'Expo Go fallback' }),
      };
    }

    try {
      await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA]);
      const tag = await NfcManager.getTag();

      try {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      return {
        success: true,
        tagId: tag?.id,
        payload: tag?.ndefMessage ? JSON.stringify(tag.ndefMessage) : undefined,
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
