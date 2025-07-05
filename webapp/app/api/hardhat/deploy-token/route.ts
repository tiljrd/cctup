import { NextRequest, NextResponse } from 'next/server';
import { executeHardhatTask, validateHardhatEnv } from '@/lib/hardhat-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      network, 
      name, 
      symbol, 
      decimals,
      supply,
      mint,
      recipient,
      privateKey, // Optional override
    } = body;

    // Validate required fields
    if (!network || !name || !symbol) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: network, name, symbol' 
      }, { status: 400 });
    }

    // Use environment variable for private key unless override provided
    const env = validateHardhatEnv(privateKey);

    // Execute Hardhat task
    const result = await executeHardhatTask({
      task: 'deploy-token',
      network,
      params: {
        name,
        symbol,
        ...(decimals && { decimals }),
        ...(supply && { supply }),
        ...(mint && { mint }),
        ...(recipient && { recipient })
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