import { Replayer } from './core/replayer.js';
import { loadReplayerConfig } from './config/loader.js';
import type { ReplayerConfig } from './types/config.js';

// Export core classes and types
export { Replayer } from './core/replayer.js';
export { buildUnsignedTransaction } from './transaction/builder.js';
export type { SerializedTransaction } from './transaction/builder.js';
export { createSigner } from './signers/factory.js';

// Export signer implementations
export { EnvPrivateKeySigner } from './signers/envPrivateKey.js';
export { RemoteHttpSigner } from './signers/remoteSigner.js';
export { WalletConnectSigner } from './signers/walletConnect.js';

// Export types
export type { 
  ReplayerConfig, 
  NetworkConfig, 
  TransactionRecord,
  UnsignedTransaction,
  ReplayDocument,
  TransactionKind,
  DecodedTransaction
} from './types/config.js';
export type { TxSigner } from './types/signer.js';

// Export config loader utilities
export { loadReplayerConfig, loadReplayDocument } from './config/loader.js';

// Export a convenient factory function for creating replayers
export async function createReplayer(config: ReplayerConfig | string): Promise<Replayer> {
  const resolvedConfig = typeof config === 'string' 
    ? await loadReplayerConfig(config)
    : config;
    
  return new Replayer(resolvedConfig);
}
