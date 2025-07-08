import { NextRequest, NextResponse } from 'next/server';
import { executeHardhatTask, validateHardhatEnv } from '@/lib/hardhat-executor';
import { loadAllNetworksSync, findNetworkByKeySync } from '@/config/serverConfigLoader';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      network, 
      address, 
      constructorArgs,
      contractName,
      privateKey
    } = body;

    console.log(`🔍 Verification request received for network: ${network}, address: ${address}, contract: ${contractName}`);

    // Validate required fields
    if (!network || !address) {
      console.log(`❌ Missing required fields - network: ${network}, address: ${address}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: network, address' 
      }, { status: 400 });
    }

    const env = validateHardhatEnv(privateKey);

    // Set verification environment variables
    process.env.PRIVATE_KEY = env.privateKey;
    process.env.ETHERSCAN_API_KEY = env.etherscanApiKey;

    // Load network configuration
    console.log(`📡 Loading network configurations...`);
    const allNetworks = loadAllNetworksSync();
    const availableNetworks = allNetworks.map(n => n.key).join(', ');
    console.log(`📡 Available networks from config: ${availableNetworks}`);
    
    const networkConfig = findNetworkByKeySync(network);
    if (!networkConfig) {
      console.log(`❌ Network not found: ${network}`);
      return NextResponse.json({ 
        success: false, 
        error: `Network configuration not found for ${network}. Available networks: ${availableNetworks}` 
      }, { status: 400 });
    }
    
    console.log(`📡 Network config for ${network}: Found - routerAddress: ${networkConfig.routerAddress}`);

    let finalConstructorArgs = constructorArgs || [];

    // Auto-populate constructor args for known pool contracts if missing or incomplete
    if (contractName === 'BurnMintTokenPool') {
      if (!finalConstructorArgs || finalConstructorArgs.length < 5) {
        console.log(`🔧 Auto-populating BurnMintTokenPool constructor args`);
        // BurnMintTokenPool constructor: token, localTokenDecimals, allowlist, rmnProxy, router
        const tokenAddress = finalConstructorArgs[0] || '0x0000000000000000000000000000000000000000';
        finalConstructorArgs = [
          tokenAddress, // 1. token address
          '18', // 2. localTokenDecimals (uint8) - NOT an array!
          '', // 3. allowlist (empty array)
          networkConfig.routerAddress, // 4. rmnProxy
          networkConfig.routerAddress  // 5. router
        ];
      }
    } else if (contractName === 'LockReleaseTokenPool') {
      if (!finalConstructorArgs || finalConstructorArgs.length < 6) {
        console.log(`🔧 Auto-populating LockReleaseTokenPool constructor args`);
        // LockReleaseTokenPool constructor needs: token, allowlist, rmnProxy, router, acceptLiquidity, owner
        const tokenAddress = finalConstructorArgs[0] || '0x0000000000000000000000000000000000000000';
        finalConstructorArgs = [
          tokenAddress, // token address
          '', // allowlist (empty array)
          networkConfig.routerAddress, // rmnProxy
          networkConfig.routerAddress, // router
          'true', // acceptLiquidity
          networkConfig.routerAddress  // owner (using router address as default)
        ];
      }
    }

    console.log(`🏗️ Final constructor args:`, finalConstructorArgs);

    // Build hardhat verify command
    const verifyArgs = [
      address,
      ...finalConstructorArgs
    ];

    console.log(`🔍 Starting verification for ${contractName} at ${address} on ${network}`);
    console.log(`📋 Verification command args:`, verifyArgs);

    // Execute verification
    const result = await executeHardhatTask({
      task: `verify ${verifyArgs.join(' ')}`,
      network,
      skipQueue: true // Verification is read-only, no need to queue
    });
    
    if (result.success) {
      console.log(`✅ Contract verification successful for ${address}`);
      return NextResponse.json({ 
        success: true, 
        result: result.stdout,
        message: `Contract ${contractName} verified successfully at ${address}` 
      });
    } else {
      console.log(`❌ Contract verification failed for ${address}:`, result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        message: `Verification failed for ${contractName} at ${address}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('🚨 Verification route error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Contract verification endpoint is ready',
    usage: 'POST with network, address, and optional constructorArgs and contractName',
    examples: {
      BurnMintERC677: {
        network: 'sepoliaFork',
        address: '0x...',
        contractName: 'BurnMintERC677',
        constructorArgs: ['TokenName', 'TKN', '18', '1000000000000000000000000']
      },
      BurnMintTokenPool: {
        network: 'sepoliaFork', 
        address: '0x...',
        contractName: 'BurnMintTokenPool',
        constructorArgs: ['0xTokenAddress'] // Will auto-fill router addresses
      }
    }
  });
} 