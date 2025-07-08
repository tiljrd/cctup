import * as dotenvenc from "@chainlink/env-enc";
dotenvenc.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "./tasks";
import "./tasks/ccip-1_5-tasks";
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// Load YAML network configuration
function loadNetworkConfig() {
  try {
    const configPath = path.join(__dirname, '../../public/network-config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    return yaml.load(fileContents) as any;
  } catch (error) {
    console.warn('Could not load network config from YAML, using fallback configuration');
    return { networks: [] };
  }
}

// Generate networks and etherscan config from YAML config
function generateNetworksAndEtherscan() {
  const yamlConfig = loadNetworkConfig();
  const networks: any = {
    hardhat: {
      chainId: 31337,
    }
  };

  // Use HARDHAT_PRIVATE_KEY for all networks
  const privateKey = process.env.HARDHAT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.warn('⚠️  HARDHAT_PRIVATE_KEY environment variable not set. Networks will be configured without accounts.');
  }

  // Add networks from YAML config
  for (const key of ["existingNetworks", "forkedNetworks"]) {
    for (const network of yamlConfig[key] || []) {
    if (network.rpcUrls && network.rpcUrls.length > 0) {
      // Add network configuration
      networks[network.key] = {
        url: network.rpcUrls[0],
        chainId: network.id,
        accounts: privateKey ? [privateKey] : []
      };
      }
    }
  }

  // Only configure Etherscan if ENABLE_VERIFICATION is explicitly set to true
  // This prevents automatic verification and only allows manual verification via tasks
  const etherscanConfig = generateEtherscanConfig(yamlConfig)

  return { 
    networks, 
    etherscan: etherscanConfig
  };
}

// Separate function to generate Etherscan config when needed
function generateEtherscanConfig(yamlConfig: any) {
  const etherscanApiKey: any = {};
  const etherscanCustomChains: any = [];

  // Add networks from YAML config
  for (const key of ["existingNetworks", "forkedNetworks"]) {
    for (const network of yamlConfig[key] || []) {
      if (network.rpcUrls && network.rpcUrls.length > 0 && network.blockExplorer?.apiURL) {
        
        if (network.blockExplorer.name === "etherscan") {
          etherscanApiKey[network.key] = "4N14RCTT66Q5VMR93DEVH625VFDSQ9NM5U";
        }

        if (network.blockExplorer.name === "blockscout") {
          etherscanApiKey[network.key] = "any-string"; // Blockscout verifier usually doesn't require a real key but expects this field
        }
        
        // Add custom chain configuration
        etherscanCustomChains.push({
          network: network.key,
          chainId: network.id,
          chainid: network.id,
          urls: {
            apiURL: network.blockExplorer.apiURL, // Use the URL directly
            browserURL: network.blockExplorer.url
          }
        });
      }
    }
  }

  return { 
    apiKey: etherscanApiKey, 
    customChains: etherscanCustomChains 
  };
}

const networkConfig = generateNetworksAndEtherscan();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "paris",
    }
  },
  networks: networkConfig.networks,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: networkConfig.etherscan,
};

export default config;
