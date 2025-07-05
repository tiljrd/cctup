import yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { YamlConfig, YamlNetwork, YamlToken } from './unifiedConfigLoader';

// Cache for loaded configuration
let cachedFullConfig: YamlConfig | null = null;

/**
 * Load the full YAML configuration (server-side only)
 * This function uses fs.readFileSync and should only be used in server-side contexts
 */
export function loadFullConfigSync(): YamlConfig {
  // Return cached config if already loaded
  if (cachedFullConfig) {
    return cachedFullConfig;
  }

  try {
    const configPath = path.join(process.cwd(), 'public', 'network-config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as YamlConfig;
    
    // Cache the configuration
    cachedFullConfig = config;
    
    return config;
  } catch (error) {
    console.error('Error loading network configuration:', error);
    throw new Error(`Failed to load network configuration: ${error}`);
  }
}

/**
 * Load only bloctopusNetworks (most common use case)
 */
export function loadBloctopusNetworksSync(): YamlNetwork[] {
  const config = loadFullConfigSync();
  return config.bloctopusNetworks || [];
}

/**
 * Load all networks (bloctopusNetworks + existingNetworks)
 * Used primarily by hardhat to configure all available networks
 */
export function loadAllNetworksSync(): YamlNetwork[] {
  const config = loadFullConfigSync();
  return [...(config.bloctopusNetworks || []), ...(config.existingNetworks || [])];
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
export function loadTokensSync(): YamlToken[] {
  const config = loadFullConfigSync();
  return config.tokens || [];
}

/**
 * Find a network by its key
 */
export function findNetworkByKeySync(networkKey: string): YamlNetwork | undefined {
  const allNetworks = loadAllNetworksSync();
  return allNetworks.find(n => n.key === networkKey);
}

/**
 * Get network RPC URL
 */
export function getNetworkRpcUrlSync(networkKey: string): string | null {
  const network = findNetworkByKeySync(networkKey);
  return network?.rpcUrls?.[0] || null;
} 