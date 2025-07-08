import { NextRequest, NextResponse } from 'next/server';
import { access, constants } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const hardhatDir = path.join(process.cwd(), 'lib/ccip-starter-kit-hardhat');
    
    // Check if Hardhat project exists
    await access(hardhatDir, constants.F_OK);
    
    // Check if node_modules exists
    await access(path.join(hardhatDir, 'node_modules'), constants.F_OK);
    
    // Check if contracts are compiled
    await access(path.join(hardhatDir, 'artifacts'), constants.F_OK);

    return NextResponse.json({
      success: true,
      hardhatReady: true,
      hardhatPath: hardhatDir,
      availableTasks: [
        'deploy-token',
        'setup-burn-mint-pool', 
        'setup-lock-release-pool',
        'configure-pool'
      ]
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      hardhatReady: false,
      error: error.message,
      suggestion: 'Run: pnpm run prepare-hardhat && pnpm run build-hardhat'
    }, { status: 500 });
  }
} 