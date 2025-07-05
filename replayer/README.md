# @cct-up/transaction-replayer

A modular multi-chain transaction replayer with pluggable signers for Ethereum and EVM-compatible chains.

## Installation

```bash
npm install @cct-up/transaction-replayer
# or
yarn add @cct-up/transaction-replayer
# or
pnpm add @cct-up/transaction-replayer
```

## Usage

### Basic Usage

```typescript
import { createReplayer, loadReplayDocument } from '@cct-up/transaction-replayer';

// Load configuration and replay document
const replayer = await createReplayer('./replayer.config.yaml');
const replayDoc = loadReplayDocument('./replay.yaml');

// Execute the replay
await replayer.replay(replayDoc);
```

### Using with Custom Configuration

```typescript
import { Replayer, EnvPrivateKeySigner } from '@cct-up/transaction-replayer';
import type { ReplayerConfig } from '@cct-up/transaction-replayer';

const config: ReplayerConfig = {
  networks: {
    mainnet: {
      chainId: 1,
      rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
      signer: {
        type: 'env-private-key',
        envVar: 'MAINNET_PRIVATE_KEY'
      }
    }
  }
};

const replayer = new Replayer(config);
```

### Frontend Integration (with Wagmi)

```typescript
import { Replayer, type TxSigner } from '@cct-up/transaction-replayer';
import { useWalletClient } from 'wagmi';

// Create a custom signer that uses wagmi
class WagmiSigner implements TxSigner {
  constructor(private walletClient: any) {}
  
  async signTransaction(tx: any): Promise<string> {
    return await this.walletClient.signTransaction(tx);
  }
  
  async sendTransaction(signedTx: string): Promise<string> {
    return await this.walletClient.sendRawTransaction({ data: signedTx });
  }
  
  async getAddress(): Promise<string> {
    return this.walletClient.account.address;
  }
}

// Use in your component
const walletClient = useWalletClient();
const signer = new WagmiSigner(walletClient.data);

// Create replayer with custom signer
const replayer = new Replayer({
  networks: {
    sepolia: {
      chainId: 11155111,
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_API_KEY',
      signer: signer // Use the custom signer
    }
  }
});
```

### Preparing Transactions Without Execution

```typescript
import { buildUnsignedTransaction } from '@cct-up/transaction-replayer';

// Build unsigned transaction
const unsignedTx = buildUnsignedTransaction({
  from: '0x...',
  to: '0x...',
  value: '1000000000000000000', // 1 ETH in wei
  data: '0x...',
  chainId: 1
});

// Return to frontend for signing
return { unsignedTransaction: unsignedTx };
```

## Configuration

### Network Configuration

```yaml
# replayer.config.yaml
networks:
  sepolia:
    chainId: 11155111
    rpcUrl: https://sepolia.infura.io/v3/YOUR_API_KEY
    signer:
      type: env-private-key
      envVar: SEPOLIA_PRIVATE_KEY
  
  polygon:
    chainId: 137
    rpcUrl: https://polygon-rpc.com
    signer:
      type: remote
      url: http://localhost:8080/sign
```

### Replay Document Format

```yaml
# replay.yaml
version: "1.0"
transactions:
  - network: sepolia
    from: "0x..."
    to: "0x..."
    value: "1000000000000000000"
    data: "0x..."
    kind: "deployment"
    
  - network: polygon
    from: "0x..."
    to: "0x..."
    data: "0x..."
    kind: "contract-call"
```

## API Reference

### Classes

- `Replayer` - Main class for replaying transactions
- `EnvPrivateKeySigner` - Signer using environment variable private keys
- `RemoteHttpSigner` - Signer that delegates to a remote HTTP endpoint
- `WalletConnectSigner` - WalletConnect integration (coming soon)

### Functions

- `createReplayer(config: ReplayerConfig | string)` - Factory function to create a replayer
- `loadReplayerConfig(path: string)` - Load configuration from YAML file
- `loadReplayDocument(path: string)` - Load replay document from YAML file
- `buildUnsignedTransaction(params)` - Build unsigned transaction object
- `createSigner(networkConfig)` - Create signer based on configuration

### Types

- `ReplayerConfig` - Main configuration type
- `NetworkConfig` - Network-specific configuration
- `TransactionRecord` - Individual transaction in replay document
- `TxSigner` - Interface for transaction signers

## License

MIT 