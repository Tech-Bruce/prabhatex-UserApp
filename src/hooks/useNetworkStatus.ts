import { useNetInfo } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const network = useNetInfo();
  return { isOffline: network.isConnected === false || network.isInternetReachable === false, isChecking: network.isConnected == null };
}
