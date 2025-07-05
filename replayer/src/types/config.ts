export interface ReplayerConfig {
  defaultGasMultiplier?: number;
  networks: Record<string, NetworkConfig>;
}

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  signer: 'envPrivateKey' | 'walletConnect' | 'remoteSigner';
  keyEnv?: string;
  remoteSignerUrl?: string;
}

export interface TransactionRecord {
  id: string;
  network?: string;
  timestamp?: number;
  blockNumber?: number;
  txIndex?: number;
  kind: TransactionKind;
  tx: UnsignedTransaction;
  decoded?: DecodedTransaction;
}

export type TransactionKind = 
  | 'contractCreation'
  | 'ethTransfer'
  | 'ethTransferToContract'
  | 'contractCallWithData'
  | 'contractCallNoData'
  | 'precompileCall';

export interface UnsignedTransaction {
  type: 0 | 1 | 2;
  from: string;
  to: string | null;
  value: string;
  gasLimit?: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  accessList?: any[];
  data?: string;
}

export interface DecodedTransaction {
  selector: string;
  fnSig: string;
  args: string[];
  abiSource: 'etherscan' | 'sourcify' | 'manual';
}

export interface ReplayDocument {
  schema_version: string;
  transactions: TransactionRecord[];
}
