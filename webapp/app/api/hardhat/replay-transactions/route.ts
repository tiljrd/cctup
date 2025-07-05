import { NextRequest, NextResponse } from 'next/server';
import { 
  Replayer, 
  type ReplayDocument,
  type SerializedTransaction 
} from '@ccip-ui/transaction-replayer';
import { loadNetworkConfig } from '@/config/configLoader';
import { createReplayerConfig } from '@/lib/replayer/networkAdapter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { replayDocument } = body;

    if (!replayDocument) {
      return NextResponse.json(
        { error: 'Replay document is required' },
        { status: 400 }
      );
    }

    // Load network configuration
    const { chains } = await loadNetworkConfig();
    
    // Create replayer configuration
    const replayerConfig = createReplayerConfig(chains);
    
    // Create replayer instance
    const replayer = new Replayer(replayerConfig);
    
    // Prepare transactions without executing them
    const preparedTransactions = await replayer.prepareTransactions(
      replayDocument as ReplayDocument
    );
    
    // Format the response
    const response = {
      success: true,
      transactions: preparedTransactions,
      networks: Object.keys(preparedTransactions),
      totalTransactions: Object.values(preparedTransactions).reduce<number>(
        (sum, txs) => sum + (txs as SerializedTransaction[]).length,
        0
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error preparing replay transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to prepare replay transactions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Replay transactions endpoint is ready',
    usage: 'POST a replay document to prepare transactions for signing',
  });
} 