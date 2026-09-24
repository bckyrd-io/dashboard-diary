import { Alert, Platform } from 'react-native';

export function confirmDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel'
): void {
  if (Platform.OS === 'web') {
    const c = (globalThis as any).confirm;
    if (typeof c === 'function' && c(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}