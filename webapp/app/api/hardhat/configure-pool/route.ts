import { NextRequest, NextResponse } from 'next/server';
import { executeHardhatTask, validateHardhatEnv } from '@/lib/hardhat-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      network, 
      localPool, 
      remoteNetwork, 
      remotePool, 
      remoteToken, 
      poolType,
      privateKey, 
      rpcUrl 
    } = body;

    if (!network || !localPool || !remoteNetwork || !remotePool || !remoteToken || !poolType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: network, localPool, remoteNetwork, remotePool, remoteToken, poolType' 
      }, { status: 400 });
    }

    // Validate poolType
    if (!['burnMint', 'lockRelease'].includes(poolType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'poolType must be either "burnMint" or "lockRelease"' 
      }, { status: 400 });
    }

    const env = validateHardhatEnv(privateKey);

    const result = await executeHardhatTask({
      task: 'configure-pool',
      network,
      params: { 
        'local-pool': localPool,
        'remote-network': remoteNetwork,
        'remote-pool': remotePool,
        'remote-token': remoteToken,
        'pool-type': poolType
      },
      env
    });

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 