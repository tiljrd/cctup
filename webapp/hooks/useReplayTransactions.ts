import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { toast } from 'sonner';
import type { ReplayDocument, SerializedTransaction } from '@cct-up/transaction-replayer';

export interface PreparedTransactions {
  transactions: Record<string, SerializedTransaction[]>;
  networks: string[];
  totalTransactions: number;
}

export function useReplayTransactions() {
  const [isLoading, setIsLoading] = useState(false);
  const [preparedTransactions, setPreparedTransactions] = useState<PreparedTransactions | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const prepareTransactions = async (replayDocument: ReplayDocument) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hardhat/replay-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replayDocument }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to prepare transactions');
      }

      const data = await response.json();
      setPreparedTransactions(data);
      return data;
    } catch (error) {
      console.error('Error preparing transactions:', error);
      toast.error('Failed to prepare transactions');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const executeTransactions = async () => {
    if (!preparedTransactions || !walletClient || !publicClient) {
      throw new Error('Missing required data for execution');
    }

    const results = [];
    
    for (const [network, transactions] of Object.entries(preparedTransactions.transactions)) {
      toast.info(`Executing ${transactions.length} transactions on ${network}`);
      
      for (const tx of transactions) {
        try {
          // Convert SerializedTransaction to wagmi format
          const wagmiTx: any = {
            to: tx.to as `0x${string}`,
            data: tx.data as `0x${string}`,
            value: tx.value ? BigInt(tx.value) : undefined,
            gas: tx.gas ? BigInt(tx.gas) : undefined,
          };

          // Add gas price based on transaction type
          if (tx.type === 2) {
            wagmiTx.maxFeePerGas = tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined;
            wagmiTx.maxPriorityFeePerGas = tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined;
          } else {
            wagmiTx.gasPrice = tx.gasPrice ? BigInt(tx.gasPrice) : undefined;
          }

          // Send transaction using wagmi
          const hash = await walletClient.sendTransaction(wagmiTx);
          
          // Wait for confirmation
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          
          results.push({
            network,
            hash,
            status: receipt.status,
          });
          
          toast.success(`Transaction ${hash} confirmed on ${network}`);
        } catch (error) {
          console.error(`Failed to execute transaction on ${network}:`, error);
          toast.error(`Failed to execute transaction on ${network}`);
          throw error;
        }
      }
    }
    
    return results;
  };

  return {
    prepareTransactions,
    executeTransactions,
    preparedTransactions,
    isLoading,
  };
} 