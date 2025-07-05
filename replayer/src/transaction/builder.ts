import { encodeFunctionData, type Hex } from 'viem';
import type { TransactionRecord } from '../types/config.js';

export interface SerializedTransaction {
  chainId: number;
  nonce: number;
  to: string | null;
  value: bigint;
  data: Hex;
  gas: bigint;
  type: 0 | 1 | 2;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  accessList?: any[];
}

export function buildUnsignedTransaction(
  record: TransactionRecord,
  chainId: number,
  nonce: number
): SerializedTransaction {
  const { tx, decoded } = record;

  const data = decoded
    ? encodeFunctionData({
        abi: [{ type: 'function', name: decoded.fnSig.split('(')[0], inputs: [] }],
        functionName: decoded.fnSig.split('(')[0],
        args: decoded.args
      })
    : (tx.data as Hex) || '0x';

  return {
    chainId,
    nonce,
    to: tx.to,
    value: BigInt(tx.value),
    data,
    gas: BigInt(tx.gasLimit || 0),
    type: tx.type,
    gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
    maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
    accessList: tx.accessList
  };
}
