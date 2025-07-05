import { NextRequest, NextResponse } from 'next/server';
import { executeHardhatTask, validateHardhatEnv } from '@/lib/hardhat-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network, token, liquidity, privateKey } = body;

    if (!network || !token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: network, token' 
      }, { status: 400 });
    }

    const env = validateHardhatEnv(privateKey);

    const result = await executeHardhatTask({
      task: 'setup-lock-release-pool',
      network,
      params: { 
        token,
        ...(liquidity && { liquidity })
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