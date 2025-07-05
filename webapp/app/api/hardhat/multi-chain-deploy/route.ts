import { NextRequest, NextResponse } from 'next/server';
import { executeHardhatTask, validateHardhatEnv } from '@/lib/hardhat-executor';

interface ChainDeploymentResult {
  success: boolean;
  tokenAddress?: string;
  poolAddress?: string;
  transactionHash?: string;
  error?: string;
}

// Support both single-chain and multi-chain requests
interface MultiChainDeploymentRequest {
  // Single chain request
  chainKey?: string;
  
  // Multi-chain request (legacy)
  chains?: string[];
  
  // Common fields
  tokenConfig: {
    name: string;
    symbol: string;
    decimals?: string;
    supply?: string;
    mint?: string;
    recipient?: string;
  };
  poolType: 'burnMint' | 'lockRelease';
  liquidity?: string;
  privateKey?: string;
  rpcUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MultiChainDeploymentRequest = await request.json();
    const { 
      chainKey,
      chains, 
      tokenConfig, 
      poolType, 
      liquidity, 
      privateKey, 
      rpcUrl 
    } = body;

    // Determine if this is a single-chain or multi-chain request
    const targetChains = chainKey ? [chainKey] : (chains || []);
    const isSingleChain = !!chainKey;

    // Validate required fields
    if (!targetChains || targetChains.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least one chain is required for deployment' 
      }, { status: 400 });
    }

    if (!isSingleChain && targetChains.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least 2 chains are required for multi-chain deployment' 
      }, { status: 400 });
    }

    if (!tokenConfig.name || !tokenConfig.symbol) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token name and symbol are required' 
      }, { status: 400 });
    }

    if (!['burnMint', 'lockRelease'].includes(poolType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'poolType must be either "burnMint" or "lockRelease"' 
      }, { status: 400 });
    }

    const env = validateHardhatEnv(privateKey);
    
    // For single-chain requests, deploy to one chain and return immediately
    if (isSingleChain) {
      const chainResult = await deployToSingleChain(targetChains[0], tokenConfig, poolType, liquidity, env);
      
      if (chainResult.success) {
        return NextResponse.json({
          success: true,
          tokenAddress: chainResult.tokenAddress,
          poolAddress: chainResult.poolAddress,
          transactionHash: chainResult.transactionHash
        });
      } else {
        return NextResponse.json({
          success: false,
          error: chainResult.error
        }, { status: 400 });
      }
    }

    // Multi-chain deployment logic
    const results: { [chainKey: string]: ChainDeploymentResult } = {};

    // Phase 1: Deploy tokens and pools on each chain
    // Use Promise.all for parallel execution across different networks
    // The transaction queue will handle sequencing within each network
    const deploymentPromises = targetChains.map(async (chainKey) => {
      const result = await deployToSingleChain(chainKey, tokenConfig, poolType, liquidity, env);
      results[chainKey] = result;
      return { chainKey, result };
    });

    // Wait for all deployments to complete
    await Promise.all(deploymentPromises);

    // Phase 2: Configure cross-chain communication
    const configurationResults: string[] = [];
    const successfulChains = Object.keys(results).filter(chain => results[chain].success);

    if (successfulChains.length >= 2) {
      console.log('Configuring cross-chain communication...');
      
      // Configure cross-chain communication in parallel
      const configPromises = [];
      
      for (const sourceChain of successfulChains) {
        for (const targetChain of successfulChains) {
          if (sourceChain !== targetChain) {
            configPromises.push(
              configureChainPair(sourceChain, targetChain, results, poolType, env)
                .then((message) => {
                  configurationResults.push(message);
                })
                .catch((error) => {
                  configurationResults.push(`${sourceChain} -> ${targetChain}: ERROR - ${error.message}`);
                })
            );
          }
        }
      }
      
      await Promise.all(configPromises);
    }

    // Calculate overall success
    const totalChains = targetChains.length;
    const successfulDeployments = successfulChains.length;
    const deploymentSuccessRate = (successfulDeployments / totalChains) * 100;

    return NextResponse.json({
      success: successfulDeployments >= 2, // At least 2 successful deployments for cross-chain
      results,
      configurationResults,
      summary: {
        totalChains,
        successfulDeployments,
        deploymentSuccessRate: Math.round(deploymentSuccessRate),
        crossChainConfigured: successfulChains.length >= 2
      }
    });

  } catch (error: any) {
    console.error('Multi-chain deployment error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Deploy token and pool to a single chain
 */
async function deployToSingleChain(
  chainKey: string,
  tokenConfig: MultiChainDeploymentRequest['tokenConfig'],
  poolType: 'burnMint' | 'lockRelease',
  liquidity: string | undefined,
  env: Record<string, string>
): Promise<ChainDeploymentResult> {
  try {
    console.log(`🚀 Starting deployment to ${chainKey}...`);
    
    // Deploy token (this will be queued per network)
    const tokenResult = await executeHardhatTask({
      task: 'deploy-token',
      network: chainKey,
      params: {
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        ...(tokenConfig.decimals && { decimals: tokenConfig.decimals }),
        ...(tokenConfig.supply && { supply: tokenConfig.supply }),
        ...(tokenConfig.mint && { mint: tokenConfig.mint }),
        ...(tokenConfig.recipient && { recipient: tokenConfig.recipient })
      },
      env
    });

    if (!tokenResult.success) {
      return {
        success: false,
        error: tokenResult.error || 'Token deployment failed'
      };
    }

    console.log(`✅ Token deployed on ${chainKey}: ${tokenResult.contractAddress}`);

    // Deploy pool (this will be queued after token deployment for the same network)
    const poolTask = poolType === 'burnMint' ? 'setup-burn-mint-pool' : 'setup-lock-release-pool';
    const poolParams: any = { 
      token: tokenResult.contractAddress 
    };
    
    if (poolType === 'lockRelease' && liquidity) {
      poolParams.liquidity = liquidity;
    }

    const poolResult = await executeHardhatTask({
      task: poolTask,
      network: chainKey,
      params: poolParams,
      env
    });

    if (!poolResult.success) {
      return {
        success: false,
        error: poolResult.error || 'Pool deployment failed',
        tokenAddress: tokenResult.contractAddress
      };
    }

    console.log(`✅ Pool deployed on ${chainKey}: ${poolResult.poolAddress}`);

    return {
      success: true,
      tokenAddress: tokenResult.contractAddress,
      poolAddress: poolResult.poolAddress,
      transactionHash: poolResult.transactionHash
    };

  } catch (error: any) {
    console.error(`❌ Deployment failed on ${chainKey}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Configure cross-chain communication between two chains
 */
async function configureChainPair(
  sourceChain: string,
  targetChain: string,
  results: { [chainKey: string]: ChainDeploymentResult },
  poolType: 'burnMint' | 'lockRelease',
  env: Record<string, string>
): Promise<string> {
  try {
    console.log(`🔗 Configuring ${sourceChain} -> ${targetChain}...`);
    
    const configResult = await executeHardhatTask({
      task: 'configure-pool',
      network: sourceChain,
      params: {
        'local-pool': results[sourceChain].poolAddress!,
        'remote-network': targetChain,
        'remote-pool': results[targetChain].poolAddress!,
        'remote-token': results[targetChain].tokenAddress!,
        'pool-type': poolType
      },
      env
    });

    if (configResult.success) {
      console.log(`✅ Configuration complete: ${sourceChain} -> ${targetChain}`);
      return `${sourceChain} -> ${targetChain}: SUCCESS`;
    } else {
      console.error(`❌ Configuration failed: ${sourceChain} -> ${targetChain}: ${configResult.error}`);
      return `${sourceChain} -> ${targetChain}: FAILED - ${configResult.error}`;
    }
  } catch (error: any) {
    console.error(`❌ Configuration error: ${sourceChain} -> ${targetChain}:`, error);
    throw error;
  }
} 