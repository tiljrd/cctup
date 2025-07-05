import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

const execAsync = promisify(exec);

/**
 * Load network configuration from YAML
 */
function loadNetworkConfig() {
  try {
    const configPath = path.join(process.cwd(), 'public', 'network-config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    return yaml.load(fileContents) as any;
  } catch (error) {
    console.warn('Could not load network config from YAML');
    return { networks: [] };
  }
}

/**
 * Get network RPC URL from YAML config
 */
function getNetworkRpcUrl(networkKey: string): string | null {
  const config = loadNetworkConfig();
  const network = config.networks?.find((n: any) => n.key === networkKey);
  return network?.rpcUrls?.[0] || null;
}

export interface HardhatTaskOptions {
  task: string;
  network: string;
  params?: Record<string, string>;
  env?: Record<string, string>;
}

export interface HardhatTaskResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  contractAddress?: string;
  transactionHash?: string;
  poolAddress?: string;
}

export async function executeHardhatTask(options: HardhatTaskOptions): Promise<HardhatTaskResult> {
  try {
    const hardhatDir = path.join(process.cwd(), 'src/ccip-starter-kit-hardhat');
    
    // Build command
    let command = `cd "${hardhatDir}" && npx hardhat ${options.task} --network ${options.network}`;
    
    // Add parameters
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null && value !== '') {
          command += ` --${key} "${value}"`;
        }
      }
    }

    // Set environment variables
    const env = {
      ...process.env,
      ...options.env
    };

    console.log(`🚀 Executing Hardhat task: ${options.task} on ${options.network}`);

    // Log available networks from YAML
    const yamlConfig = loadNetworkConfig();
    const availableNetworks = yamlConfig.networks?.map((n: any) => n.key) || [];
    console.log(`📡 Available networks from YAML: ${availableNetworks.join(', ')}`);
    
    // Execute with timeout
    const { stdout, stderr } = await execAsync(command, { 
      env,
      cwd: hardhatDir,
      maxBuffer: 1024 * 1024, // 1MB buffer
      timeout: 300000 // 5 minute timeout
    });

    // Parse common outputs
    const result: HardhatTaskResult = {
      success: true,
      stdout,
      stderr: stderr || undefined
    };

    // Extract contract address (for deployments)
    const addressMatch = stdout.match(/deployed at address: (0x[a-fA-F0-9]{40})/i);
    if (addressMatch) {
      result.contractAddress = addressMatch[1];
    }

    // Extract pool address (for pool setups)  
    const poolMatch = stdout.match(/setup complete.*at address: (0x[a-fA-F0-9]{40})/i);
    if (poolMatch) {
      result.poolAddress = poolMatch[1];
    }

    // Extract transaction hash
    const txMatch = stdout.match(/transaction hash: (0x[a-fA-F0-9]{64})/i);
    if (txMatch) {
      result.transactionHash = txMatch[1];
    }

    return result;

  } catch (error: any) {
    console.error('Hardhat task failed:', error);
    
    return {
      success: false,
      error: error.message,
      stdout: error.stdout || undefined,
      stderr: error.stderr || undefined
    };
  }
}

/**
 * Validate environment and prepare for Hardhat execution
 */
export function validateHardhatEnv(privateKey?: string): Record<string, string> {
  const env: Record<string, string> = {};

  // Use provided private key or fall back to environment variable
  const finalPrivateKey = privateKey || process.env.HARDHAT_PRIVATE_KEY;
  if (!finalPrivateKey) {
    throw new Error('Private key is required. Set HARDHAT_PRIVATE_KEY environment variable or provide privateKey parameter.');
  }

  env.HARDHAT_PRIVATE_KEY = finalPrivateKey;

  return env;
}

/**
 * Get available networks from YAML config
 */
export function getAvailableNetworks(): string[] {
  const config = loadNetworkConfig();
  return config.networks?.map((n: any) => n.key) || [];
} 