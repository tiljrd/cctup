import type { TxSigner } from '../types/signer.js';
import type { NetworkConfig } from '../types/config.js';
import { EnvPrivateKeySigner } from './envPrivateKey.js';
import { WalletConnectSigner } from './walletConnect.js';
import { RemoteHttpSigner } from './remoteSigner.js';

export function createSigner(networkConfig: NetworkConfig): TxSigner {
  switch (networkConfig.signer) {
    case 'envPrivateKey':
      return new EnvPrivateKeySigner(networkConfig);
    case 'walletConnect':
      return new WalletConnectSigner(networkConfig);
    case 'remoteSigner':
      return new RemoteHttpSigner(networkConfig);
    default:
      throw new Error(`Unknown signer type: ${networkConfig.signer}`);
  }
}
