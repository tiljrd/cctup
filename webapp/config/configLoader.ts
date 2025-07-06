import { Chain, defineChain } from 'viem';
import * as viemChains from 'viem/chains';
import { AddressMap, NetworkConfig, Token } from '@chainlink/ccip-react-components';
import { loadAllNetworks, loadTokens, YamlNetwork, YamlToken } from './unifiedConfigLoader';

// Cache for loaded configuration
let cachedConfig: { networkConfig: NetworkConfig; chains: Chain[]; chainMap: Map<number, Chain> } | null = null;

export async function loadNetworkConfig(): Promise<{
  networkConfig: NetworkConfig;
  chains: Chain[];
  chainMap: Map<number, Chain>;
}> {
  // Return cached config if already loaded
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // Load networks and tokens using unified loader
    const allNetworks = await loadAllNetworks();
    const tokens = await loadTokens();

    // Create chain map and chains array
    const chainMap = new Map<number, Chain>();
    const chains: Array<{ chain: Chain; logoURL: string }> = [];
    const linkContracts: AddressMap = {};
    const routerAddresses: AddressMap = {};
    const chainSelectors: Record<number, string> = {};

    // Process all networks (forkedNetworks + existingNetworks)
    for (const network of allNetworks) {
      // Check if chain exists in viem/chains
      const existingChain = Object.values(viemChains).find(
        (chain) => chain.id === network.id
      );

      let chain: Chain;
      if (existingChain) {
        // Use existing chain definition
        chain = existingChain;
      } else {
        // Define custom chain
        chain = defineChain({
          id: network.id,
          name: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: {
            default: {
              http: network.rpcUrls,
            },
          },
          blockExplorers: {
            default: {
              name: network.blockExplorer.name,
              url: network.blockExplorer.url,
            },
          },
          testnet: network.testnet,
        });
      }

      chainMap.set(network.id, chain);
      chains.push({
        chain,
        logoURL: network.logoURL,
      });

      // Add CCIP-specific configurations
      if (network.linkContract) {
        linkContracts[network.id] = network.linkContract as `0x${string}`;
      }
      if (network.routerAddress) {
        routerAddresses[network.id] = network.routerAddress as `0x${string}`;
      }
      if (network.chainSelector) {
        chainSelectors[network.id] = network.chainSelector;
      }
    }

    // Process tokens
    const tokensList: Token[] = tokens.map((token) => {
      const addressMap: AddressMap = {};
      
      // Convert string keys to chain IDs
      for (const [networkKey, address] of Object.entries(token.addresses)) {
        const network = allNetworks.find((n) => n.key === networkKey);
        if (network && address) {
          addressMap[network.id] = address as `0x${string}`;
        }
      }
      return {
        symbol: token.symbol,
        address: addressMap,
        logoURL: token.logoURL,
        tags: token.tags,
      };
    });

    const networkConfig: NetworkConfig = {
      chains,
      linkContracts,
      routerAddresses,
      chainSelectors,
      tokensList,
    };

    // Cache the configuration
    cachedConfig = {
      networkConfig,
      chains: Array.from(chainMap.values()),
      chainMap,
    };

    return cachedConfig;
  } catch (error) {
    console.error('Error loading network configuration:', error);
    // Fallback to empty config or throw error based on your preference
    throw new Error(`Failed to load network configuration: ${error}`);
  }
}

// Helper function to clear the cache (useful for development)
export function clearConfigCache() {
  cachedConfig = null;
}