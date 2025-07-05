import { createPublicClient, http } from 'viem';
import type { ReplayerConfig, ReplayDocument, TransactionRecord } from '../types/config.js';
import type { SerializedTransaction } from '../transaction/builder.js';
import { buildUnsignedTransaction } from '../transaction/builder.js';
import { createSigner } from '../signers/factory.js';

export class Replayer {
  private publicClients: Record<string, ReturnType<typeof createPublicClient>> = {};

  constructor(private config: ReplayerConfig) {
    this.initializeClients();
  }

  private initializeClients() {
    for (const [networkName, networkConfig] of Object.entries(this.config.networks)) {
      this.publicClients[networkName] = createPublicClient({
        chain: {
          id: networkConfig.chainId,
          name: networkName,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: [networkConfig.rpcUrl] }
          }
        },
        transport: http(networkConfig.rpcUrl)
      });
    }
  }

  async replay(document: ReplayDocument): Promise<void> {
    const queues = this.organizeTransactionsByNetwork(document.transactions);
    
    await Promise.all(
      Object.entries(queues).map(([networkName, transactions]) =>
        this.replayNetworkTransactions(networkName, transactions)
      )
    );
  }

  async prepareTransactions(document: ReplayDocument): Promise<Record<string, SerializedTransaction[]>> {
    const queues = this.organizeTransactionsByNetwork(document.transactions);
    const preparedTransactions: Record<string, SerializedTransaction[]> = {};

    for (const [networkName, transactions] of Object.entries(queues)) {
      preparedTransactions[networkName] = await this.prepareNetworkTransactions(networkName, transactions);
    }

    return preparedTransactions;
  }

  private organizeTransactionsByNetwork(transactions: TransactionRecord[]): Record<string, TransactionRecord[]> {
    const queues: Record<string, TransactionRecord[]> = {};

    for (const tx of transactions) {
      const network = tx.network || 'ethereum-mainnet';
      if (!queues[network]) {
        queues[network] = [];
      }
      queues[network].push(tx);
    }

    for (const networkName in queues) {
      queues[networkName].sort((a, b) => {
        const nonceA = this.extractNonce(a);
        const nonceB = this.extractNonce(b);
        return nonceA - nonceB;
      });
    }

    return queues;
  }

  private extractNonce(tx: TransactionRecord): number {
    return tx.txIndex || 0;
  }

  private async prepareNetworkTransactions(networkName: string, transactions: TransactionRecord[]): Promise<SerializedTransaction[]> {
    const networkConfig = this.config.networks[networkName];
    if (!networkConfig) {
      throw new Error(`Network configuration not found for ${networkName}`);
    }

    const client = this.publicClients[networkName];
    const nonceCache = new Map<string, number>();
    const preparedTxs: SerializedTransaction[] = [];

    for (const txRecord of transactions) {
      try {
        const nonce = await this.getNonce(client, txRecord.tx.from, nonceCache);
        
        let tx = buildUnsignedTransaction(txRecord, networkConfig.chainId, nonce);
        
        tx = await this.enhanceTransactionWithFees(client, tx);
        
        preparedTxs.push(tx);
        
        nonceCache.set(txRecord.tx.from, nonce + 1);
      } catch (error) {
        console.error(`[${networkName}] Failed to prepare transaction ${txRecord.id}:`, error);
        throw error;
      }
    }

    return preparedTxs;
  }

  private async replayNetworkTransactions(networkName: string, transactions: TransactionRecord[]): Promise<void> {
    const networkConfig = this.config.networks[networkName];
    if (!networkConfig) {
      throw new Error(`Network configuration not found for ${networkName}`);
    }

    const signer = createSigner(networkConfig);
    const client = this.publicClients[networkName];
    const nonceCache = new Map<string, number>();

    for (const txRecord of transactions) {
      try {
        const nonce = await this.getNonce(client, txRecord.tx.from, nonceCache);
        
        let tx = buildUnsignedTransaction(txRecord, networkConfig.chainId, nonce);
        
        tx = await this.enhanceTransactionWithFees(client, tx);
        
        const signedTx = await signer.sign(tx, networkConfig.chainId);
        
        const hash = await client.sendRawTransaction({ 
          serializedTransaction: signedTx 
        });
        
        console.log(`[${networkName}] Sent transaction ${txRecord.id}: ${hash}`);
        
        nonceCache.set(txRecord.tx.from, nonce + 1);
      } catch (error) {
        console.error(`[${networkName}] Failed to send transaction ${txRecord.id}:`, error);
        throw error;
      }
    }
  }

  private async getNonce(client: any, address: string, cache: Map<string, number>): Promise<number> {
    if (cache.has(address)) {
      return cache.get(address)!;
    }

    const nonce = await client.getTransactionCount({ address });
    cache.set(address, nonce);
    return nonce;
  }

  private async enhanceTransactionWithFees(client: any, tx: SerializedTransaction): Promise<SerializedTransaction> {
    const gasMultiplier = this.config.defaultGasMultiplier || 1.0;

    tx.gas = await client.estimateGas({
      to: tx.to,
      value: tx.value,
      data: tx.data
    });

    if (tx.type === 2) {
      const feeData = await client.estimateFeesPerGas();
      tx.maxFeePerGas = BigInt(Math.ceil(Number(feeData.maxFeePerGas) * gasMultiplier));
      tx.maxPriorityFeePerGas = BigInt(Math.ceil(Number(feeData.maxPriorityFeePerGas) * gasMultiplier));
    } else if (tx.type === 0 || tx.type === 1) {
      const gasPrice = await client.getGasPrice();
      tx.gasPrice = BigInt(Math.ceil(Number(gasPrice) * gasMultiplier));
    }

    return tx;
  }
}
