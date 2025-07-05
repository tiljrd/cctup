import { createWalletClient, http, type Hex, defineChain } from 'viem';
import type { TxSigner } from '../types/signer.js';
import type { NetworkConfig } from '../types/config.js';

export class EnvPrivateKeySigner implements TxSigner {
  constructor(private networkConfig: NetworkConfig) {}

  async sign(tx: any, chainId: number): Promise<Hex> {
    const privateKey = process.env[this.networkConfig.keyEnv!];
    if (!privateKey) {
      throw new Error(`Private key environment variable ${this.networkConfig.keyEnv} is not set`);
    }

    const chain = defineChain({
      id: chainId,
      name: `Chain ${chainId}`,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [this.networkConfig.rpcUrl] }
      }
    });

    const wallet = createWalletClient({
      chain,
      transport: http(this.networkConfig.rpcUrl),
      account: privateKey as Hex
    });

    return await wallet.signTransaction(tx);
  }
}
