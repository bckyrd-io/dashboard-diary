import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export function stateIsOnline(state: NetInfoState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return stateIsOnline(state);
  } catch {
    return true;
  }
}

export function subscribeNetwork(listener: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => listener(stateIsOnline(state)));
}
