import { NetworkConfig } from '@chainlink/ccip-react-components';
import { loadNetworkConfig } from './configLoader';

// This will be populated when the config is loaded
let dynamicNetworkConfig: NetworkConfig | null = null;

export async function getDynamicNetworkConfig(): Promise<NetworkConfig> {
  if (!dynamicNetworkConfig) {
    const { networkConfig } = await loadNetworkConfig();
    dynamicNetworkConfig = networkConfig;
  }
  return dynamicNetworkConfig;
}

// For components that need synchronous access after initial load
export function getNetworkConfig(): NetworkConfig {
  if (!dynamicNetworkConfig) {
    throw new Error('Network configuration not loaded. Call getDynamicNetworkConfig() first.');
  }
  return dynamicNetworkConfig;
} 