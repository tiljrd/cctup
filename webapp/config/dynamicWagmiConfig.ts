import { http, createConfig, Config } from "wagmi";
import { injected } from "wagmi/connectors";
import { loadNetworkConfig } from './configLoader';

let dynamicWagmiConfig: Config | null = null;

export async function getDynamicWagmiConfig(): Promise<Config> {
  if (dynamicWagmiConfig) {
    return dynamicWagmiConfig;
  }

  const { chains, chainMap } = await loadNetworkConfig();
  
  // Create transports for each chain
  const transports: Record<number, any> = {};
  chains.forEach((chain) => {
    transports[chain.id] = http();
  });

  dynamicWagmiConfig = createConfig({
    chains: chains as any, // Type assertion needed due to wagmi's strict typing
    connectors: [injected()],
    transports,
  });

  return dynamicWagmiConfig;
}

// For components that need synchronous access after initial load
export function getWagmiConfig(): Config {
  if (!dynamicWagmiConfig) {
    throw new Error('Wagmi configuration not loaded. Call getDynamicWagmiConfig() first.');
  }
  return dynamicWagmiConfig;
} 