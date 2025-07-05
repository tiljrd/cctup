import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

const execAsync = promisify(exec);

// Transaction queue to manage sequential execution per network
const networkQueues = new Map<string, Array<() => Promise<any>>>();
const activeNetworks = new Set<string>();

/**
 * Sleep utility for adding delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic and exponential backoff
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000,
  networkKey: string = 'unknown'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a nonce/timing related error that we should retry
      const shouldRetry = isRetryableError(error.message);
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⏳ Retry ${attempt}/${maxRetries} for ${networkKey} after ${Math.round(delay)}ms delay...`);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Check if error is retryable (nonce/timing related)
 */
function isRetryableError(errorMessage: string): boolean {
  const lowerError = errorMessage.toLowerCase();
  return (
    lowerError.includes('already known') ||
    lowerError.includes('nonce too low') ||
    lowerError.includes('replacement transaction underpriced') ||
    lowerError.includes('transaction underpriced') ||
    lowerError.includes('pending') ||
    lowerError.includes('timeout') ||
    lowerError.includes('network error') ||
    lowerError.includes('econnrefused')
  );
}

/**
 * Add task to network queue for sequential execution
 */
async function queueNetworkTask<T>(networkKey: string, task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    // Get or create queue for this network
    if (!networkQueues.has(networkKey)) {
      networkQueues.set(networkKey, []);
    }
    
    const queue = networkQueues.get(networkKey)!;
    
    // Add task to queue
    queue.push(async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    // Process queue if not already active
    if (!activeNetworks.has(networkKey)) {
      processNetworkQueue(networkKey);
    }
  });
}

/**
 * Process network queue sequentially
 */
async function processNetworkQueue(networkKey: string): Promise<void> {
  if (activeNetworks.has(networkKey)) {
    return; // Already processing
  }
  
  activeNetworks.add(networkKey);
  const queue = networkQueues.get(networkKey)!;
  
  try {
    while (queue.length > 0) {
      const task = queue.shift()!;
      await task();
      
      // Add delay between transactions on the same network
      if (queue.length > 0) {
        console.log(`⏳ Adding 3s delay between transactions on ${networkKey}...`);
        await sleep(3000);
      }
    }
  } finally {
    activeNetworks.delete(networkKey);
  }
}

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

/**
 * Parse technical errors into user-friendly messages
 */
function parseHardhatError(errorMessage: string, networkKey: string): string {
  const lowerError = errorMessage.toLowerCase();
  
  // Insufficient funds error
  if (lowerError.includes('insufficient funds')) {
    const balanceMatch = errorMessage.match(/balance (\d+)/);
    const costMatch = errorMessage.match(/tx cost (\d+)/);
    
    if (balanceMatch && costMatch) {
      const balance = parseFloat(balanceMatch[1]) / 1e18; // Convert wei to ETH
      const cost = parseFloat(costMatch[1]) / 1e18;
      
      return `Insufficient funds to pay for gas fees. Your balance: ${balance.toFixed(4)} tokens, required: ${cost.toFixed(4)} tokens. Please add more native tokens to your wallet for network "${networkKey}".`;
    }
    
    return `Insufficient funds to pay for transaction gas fees. Please add more native tokens to your wallet for the "${networkKey}" network.`;
  }
  
  // Network connection errors
  if (lowerError.includes('enotfound') || lowerError.includes('connect econnrefused') || lowerError.includes('network error')) {
    return `Unable to connect to the "${networkKey}" network. Please check your internet connection and try again.`;
  }
  
  // RPC errors
  if (lowerError.includes('missing response') || lowerError.includes('rpc')) {
    return `RPC connection failed for "${networkKey}" network. The network may be experiencing issues, please try again later.`;
  }
  
  // Already known / duplicate transaction errors
  if (lowerError.includes('already known') || lowerError.includes('nonce too low') || lowerError.includes('replacement transaction underpriced')) {
    return `Transaction conflict detected on "${networkKey}" network. This has been automatically handled with retry logic.`;
  }
  
  // Nonce errors
  if (lowerError.includes('nonce') && lowerError.includes('too low')) {
    return `Transaction nonce error on "${networkKey}" network. This has been automatically handled with retry logic.`;
  }
  
  // Gas limit errors
  if (lowerError.includes('out of gas') || lowerError.includes('gas limit')) {
    return `Transaction failed due to insufficient gas limit. This may indicate a problem with the contract deployment.`;
  }
  
  // Contract compilation errors
  if (lowerError.includes('compilation failed') || lowerError.includes('solidity')) {
    return `Smart contract compilation failed. Please check the contract code and try again.`;
  }
  
  // Private key errors
  if (lowerError.includes('private key') || lowerError.includes('invalid account')) {
    return `Invalid private key or account configuration. Please check your wallet settings.`;
  }
  
  // Network not found
  if (lowerError.includes('unknown network') || lowerError.includes('network not found')) {
    return `Network "${networkKey}" is not configured. Please check your network configuration.`;
  }
  
  // Revert errors (contract rejection)
  if (lowerError.includes('revert') || lowerError.includes('execution reverted')) {
    const revertMatch = errorMessage.match(/revert (.+?)(?:\n|$)/i);
    if (revertMatch) {
      return `Contract execution failed: ${revertMatch[1]}`;
    }
    return `Contract execution was reverted. The transaction was rejected by the smart contract.`;
  }
  
  // Rate limiting
  if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
    return `Rate limit exceeded for "${networkKey}" network. Please wait a moment and try again.`;
  }
  
  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return `Transaction timed out on "${networkKey}" network. The network may be congested, please try again.`;
  }
  
  // For unknown errors, try to extract the most relevant part
  const lines = errorMessage.split('\n');
  const relevantLine = lines.find(line => 
    line.includes('Error:') || 
    line.includes('ProviderError:') || 
    line.includes('reason:') ||
    line.includes('message:')
  );
  
  if (relevantLine) {
    // Clean up the error message
    let cleanError = relevantLine
      .replace(/^.*?Error:\s*/, '')
      .replace(/^.*?ProviderError:\s*/, '')
      .replace(/^.*?reason:\s*/, '')
      .replace(/^.*?message:\s*/, '')
      .trim();
    
    // If it's still too technical, provide a generic message
    if (cleanError.length > 200 || cleanError.includes('node_modules') || cleanError.includes('at ')) {
      return `Deployment failed on "${networkKey}" network. Please check your configuration and try again.`;
    }
    
    return `Deployment failed: ${cleanError}`;
  }
  
  // Fallback for completely unknown errors
  return `Deployment failed on "${networkKey}" network. Please check your configuration and try again.`;
}

export interface HardhatTaskOptions {
  task: string;
  network: string;
  params?: Record<string, string>;
  env?: Record<string, string>;
  skipQueue?: boolean; // Option to skip queue for non-transaction tasks
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
  const executeTask = async (): Promise<HardhatTaskResult> => {
    return executeWithRetry(async () => {
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
    }, 3, 2000, options.network);
  };

  try {
    // For tasks that don't involve transactions, execute immediately
    if (options.skipQueue) {
      return await executeTask();
    }
    
    // Queue transaction tasks to avoid nonce conflicts
    return await queueNetworkTask(options.network, executeTask);
    
  } catch (error: any) {
    console.error('Hardhat task failed:', error);
    
    // Parse the error message to provide user-friendly feedback
    const userFriendlyError = parseHardhatError(error.message, options.network);
    
    return {
      success: false,
      error: userFriendlyError,
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

/**
 * Get block explorer URL for a contract address on a specific network
 */
export function getBlockExplorerUrl(networkKey: string, contractAddress: string): string | null {
  const config = loadNetworkConfig();
  const network = config.networks?.find((n: any) => n.key === networkKey);
  
  if (!network?.blockExplorer?.url) {
    return null;
  }
  
  return `${network.blockExplorer.url}/address/${contractAddress}`;
}

/**
 * Get network display name from network key
 */
export function getNetworkDisplayName(networkKey: string): string {
  const config = loadNetworkConfig();
  const network = config.networks?.find((n: any) => n.key === networkKey);
  return network?.name || networkKey;
} 