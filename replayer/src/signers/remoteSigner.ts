import type { Hex } from 'viem';
import type { TxSigner } from '../types/signer.js';
import type { NetworkConfig } from '../types/config.js';

export class RemoteHttpSigner implements TxSigner {
  constructor(private networkConfig: NetworkConfig) {}

  async sign(tx: any, chainId: number): Promise<Hex> {
    if (!this.networkConfig.remoteSignerUrl) {
      throw new Error('Remote signer URL is required for remoteSigner type');
    }

    const response = await fetch(this.networkConfig.remoteSignerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: tx,
        chainId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Remote signer request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.signature as Hex;
  }
}
