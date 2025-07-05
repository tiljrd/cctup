import type { Hex } from 'viem';

export interface TxSigner {
  sign(tx: any, chainId: number): Promise<Hex>;
}

export interface SignerConfig {
  type: 'envPrivateKey' | 'walletConnect' | 'remoteSigner';
  keyEnv?: string;
  remoteSignerUrl?: string;
}
