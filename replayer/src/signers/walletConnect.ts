import type { Hex } from 'viem';
import type { TxSigner } from '../types/signer.js';
import type { NetworkConfig } from '../types/config.js';

export class WalletConnectSigner implements TxSigner {
  constructor(private networkConfig: NetworkConfig) {}

  async sign(tx: any, chainId: number): Promise<Hex> {
    throw new Error('WalletConnect signer not yet implemented - requires browser integration');
  }
}
