import yaml from 'js-yaml';

// Type definitions for the YAML structure
export interface YamlNetwork {
  id: number;
  key: string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorer: {
    name: string;
    url: string;
    apiURL?: string;
    apiKey?: string;
    type?: string;
  };
  logoURL: string;
  testnet: boolean;
  chainSelector: string;
  linkContract: string;
  routerAddress: string;
  fork?: string;
  forkedFrom?: string;
}

export interface YamlToken {
  symbol: string;
  logoURL: string;
  tags: string[];
  addresses: Record<string, string>;
}

export interface YamlConfig {
  forkedNetworks: YamlNetwork[];
  existingNetworks: YamlNetwork[];
  tokens: YamlToken[];
}

// Cache for loaded configuration
let cachedFullConfig: YamlConfig | null = null;

/**
 * Load the full YAML configuration (client-side safe)
 * This function can be used in both client and server environments
 */
export async function loadFullConfig(): Promise<YamlConfig> {
  // Return cached config if already loaded
  if (cachedFullConfig) {
    return cachedFullConfig;
  }

  try {
    const configPath = process.env.NEXT_PUBLIC_CCIP_CONFIG_FILE || '/network-config.yaml';
    
    // Fetch the YAML file
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load config from ${configPath}: ${response.statusText}`);
    }
    
    const yamlContent = await response.text();
    const config = yaml.load(yamlContent) as YamlConfig;
    
    // Cache the configuration
    cachedFullConfig = config;
    
    return config;
  } catch (error) {
    console.error('Error loading network configuration:', error);
    throw new Error(`Failed to load network configuration: ${error}`);
  }
}

/**
 * Load only forkedNetworks (most common use case)
 */
export async function loadForkedNetworks(): Promise<YamlNetwork[]> {
  const config = await loadFullConfig();
  return config.forkedNetworks || [];
}

export async function loadExistingNetworks(): Promise<YamlNetwork[]> {
  const config = await loadFullConfig();
  return config.existingNetworks || [];
}

/**
 * Load all networks (forkedNetworks + existingNetworks)
 * Used primarily by hardhat to configure all available networks
 */
export async function loadAllNetworks(): Promise<YamlNetwork[]> {
  const config = await loadFullConfig();
  return [...(config.forkedNetworks || []), ...(config.existingNetworks || [])];
}

/**
 * Clear the configuration cache (useful for development/testing)
 */
export function clearConfigCache() {
  cachedFullConfig = null;
}

/**
 * Get tokens from the configuration
 */
export async function loadTokens(): Promise<YamlToken[]> {
  const config = await loadFullConfig();
  return config.tokens || [];
}

/**
 * Find a network by its key
 */
export async function findNetworkByKey(networkKey: string): Promise<YamlNetwork | undefined> {
  const allNetworks = await loadAllNetworks();
  return allNetworks.find(n => n.key === networkKey);
}

/**
 * Get block explorer URL for a contract address on a specific network
 */
export async function getBlockExplorerUrl(networkKey: string, contractAddress: string): Promise<string | null> {
  const network = await findNetworkByKey(networkKey);
  
  if (!network?.blockExplorer?.url) {
    return null;
  }
  
  return `${network.blockExplorer.url}/address/${contractAddress}`;
} 