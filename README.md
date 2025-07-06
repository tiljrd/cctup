# CCTUP - Cross-Chain Transaction Utility Platform

A comprehensive blockchain indexing, replay, and cross-chain token deployment platform that enables recording transactions from forked networks and replaying them on actual networks.

## Overview

CCTUP consists of four main components that work together to provide a complete cross-chain transaction management solution:

- **🔍 Indexer**: Extracts and indexes blockchain transaction data using firehose RPC polling
- **🔄 Replayer**: Replays indexed transactions on actual networks using viem
- **🌐 Webapp**: Full-featured CCT token manager and deployer with multi-chain support
- **🏗️ Orchestrator**: Infrastructure management using Kurtosis for spinning up forked networks

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Orchestrator  │───▶│     Indexer     │───▶│    Replayer     │
│   (Kurtosis)    │    │ (Firehose+Graph)│    │     (Viem)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Forked Networks │    │ Indexed Data    │    │ Actual Networks │
│ (Test/Staging)  │    │   (GraphQL)     │    │  (Production)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Webapp      │
                       │ (Token Manager) │
                       └─────────────────┘
```

## 🔍 Indexer

The indexer extracts, classifies, and decodes Ethereum transaction data from forked networks using a multi-component architecture.

### Key Features

- **Firehose RPC Polling**: Connects to multiple forked networks via RPC endpoints instead of requiring full instrumented nodes
- **Substreams Processing**: Rust-based real-time data extraction and transaction classification
- **Subgraph Storage**: GraphQL-queryable database for persistent transaction storage
- **ABI Decoding**: Automatic contract ABI fetching and transaction data decoding

### Transaction Classification

The indexer classifies transactions into 6 distinct types:
- `contractCreation` - New contract deployments
- `ethTransfer` - Simple ETH transfers between EOAs
- `ethTransferToContract` - ETH transfers to contract addresses
- `contractCallWithData` - Contract function calls with input data
- `contractCallNoData` - Contract calls without input data
- `precompileCall` - Calls to Ethereum precompiled contracts

### Indexed Data Structure

```typescript
interface TxRecord {
  id: bytes;           // Transaction hash
  kind: string;        // Transaction classification
  network: string;     // Source network identifier
  raw: {
    from: bytes;                    // Sender address
    to: bytes;                      // Recipient address
    value: string;                  // ETH value (hex)
    gas_limit: uint64;              // Gas limit
    gas_price: string;              // Gas price (hex)
    max_fee_per_gas: string;        // EIP-1559 max fee (hex)
    max_priority_fee_per_gas: string; // EIP-1559 priority fee (hex)
    access_list: string;            // Access list (hex)
    data: bytes;                    // Transaction input data
    tx_type: uint32;                // Transaction type (0, 1, 2)
  };
  decoded?: {
    selector: string;    // Function selector (0x...)
    fn_sig: string;      // Human-readable function signature
    args: string[];      // Decoded function arguments
    abi_source: string;  // Source of ABI (etherscan, etc.)
    args_json: string;   // JSON-formatted arguments
  };
}
```

### Setup and Usage

```bash
cd indexer

# Install dependencies
pnpm install

# Set up environment
cp scripts/.env.example scripts/.env
# Edit scripts/.env with your ETHERSCAN_KEY

# Build all components
pnpm build

# Run with firehose RPC polling (recommended for forked networks)
cd substreams
docker run --rm -d --name firehose-rpc -p 13042:13042 \
  ghcr.io/streamingfast/firehose-ethereum:40d5054 \
  start firehose \
  --substreams-enabled \
  --substreams-rpc-endpoints="http://your-forked-network:8545" \
  --firehose-grpc-listen-addr=":13042"

# Run substreams against local firehose
substreams run map_transactions -e localhost:13042 --plaintext
```

## 🔄 Replayer

The replayer takes indexed transaction data and submits it to actual networks using viem. It supports both CLI usage and backend integration.

### Key Features

- **Viem Integration**: Modern TypeScript Ethereum library for transaction handling
- **Multi-Network Support**: Configurable network support with automatic nonce management
- **Flexible Signers**: Support for environment variables, remote HTTP signers, and wallet integrations
- **CLI and Backend Modes**: Can be used as a standalone CLI tool or integrated as a backend service
- **Transaction Preparation**: Build unsigned transactions for frontend signing

### Usage

#### CLI Mode
```bash
cd replayer

# Install dependencies
pnpm install

# Configure networks
cp replayer.config.yaml.example replayer.config.yaml
# Edit with your network configurations

# Replay transactions
pnpm replay ./replay.yaml
```

#### Backend Integration
```typescript
import { createReplayer, loadReplayDocument } from '@cct-up/transaction-replayer';

// Create replayer instance
const replayer = await createReplayer('./replayer.config.yaml');

// Load and replay transactions
const replayDoc = loadReplayDocument('./replay.yaml');
await replayer.replay(replayDoc);
```

#### Frontend Integration (Prepare for Wagmi)
```typescript
// Prepare unsigned transactions for frontend signing
const unsignedTxs = await replayer.prepareTransactions(replayDoc);
// Send to frontend for wallet signing via wagmi
```

## 🌐 Webapp

A Next.js application providing a full CCT (Cross-Chain Token) manager and deployer that works with both forked networks and actual public networks.

### Key Features

- **Multi-Chain Token Deployment**: Deploy tokens across multiple networks simultaneously
- **Forked Network Testing**: Test deployments on forked networks before going live
- **Dual Wallet Support**: 
  - **Forked Networks**: Uses `HARDHAT_PRIVATE_KEY` environment variable for automated transactions
  - **Actual Networks**: Uses wagmi for wallet interactions (MetaMask, WalletConnect, etc.)
- **Dynamic Configuration**: YAML-based network configuration for easy customization
- **Pool Management**: Support for both burn/mint and lock/release token pools
- **Transaction Replay**: Integration with replayer for testing transaction sequences

### Environment Setup

#### For Forked Networks
```bash
# Required for automated transactions on forked networks
export HARDHAT_PRIVATE_KEY="0x..."

# Start development server
npm run dev
```

#### For Actual Networks
The webapp automatically uses wagmi for wallet connections when interacting with public networks. No private key needed - users connect their wallets directly.

### Configuration

Create or modify `/public/network-config.yaml`:

```yaml
networks:
  - id: 11155111
    key: "sepolia"
    name: "Sepolia"
    rpcUrls:
      - "https://ethereum-sepolia.publicnode.com"
    chainSelector: "16015286601757825753"
    linkContract: "0x779..."
    routerAddress: "0x0BF..."

tokens:
  - symbol: "CCIP-BnM"
    addresses:
      sepolia: "0xFd57..."
```

### Usage

```bash
cd webapp

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Orchestrator

The orchestrator leverages Kurtosis to spin up all the necessary infrastructure including forked networks, firehose instances, graph nodes, and indexer services.

### Key Features

- **Kurtosis Integration**: Declarative infrastructure management
- **Forked Network Creation**: Automatically creates forked versions of mainnet networks
- **Complete Stack Deployment**: Sets up firehose, graph-node, IPFS, and PostgreSQL
- **Subgraph Deployment**: Automatically deploys and configures subgraphs
- **Service Discovery**: Provides endpoints for all deployed services

### Infrastructure Components

- **Forked Ethereum Networks**: Using ethereum-package with RPC forking
- **Firehose**: For blockchain data streaming with RPC polling
- **Graph Node**: For subgraph indexing and GraphQL queries
- **PostgreSQL**: Database backend for graph-node
- **IPFS**: Distributed storage for subgraph metadata
- **Indexer Service**: Automated subgraph deployment

### Setup and Usage

```bash
# Install Kurtosis
curl -fsSL https://docs.kurtosis.com/install.sh | bash

# Run the orchestrator
cd orchestrator
kurtosis run . '{"existing_networks": [{"id": 1, "key": "mainnet", "fork_url": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"}]}'
```

### Configuration

Edit `cctup-networks-configs-template.yaml` to configure:
- Network fork URLs
- Chain selectors for CCIP
- Contract addresses
- Service parameters

## Getting Started

### Quick Start (Full Stack)

1. **Set up the orchestrator** to create forked networks:
```bash
cd orchestrator
kurtosis run . '{"existing_networks": [{"id": 1, "key": "mainnet", "fork_url": "https://your-rpc-url"}]}'
```

2. **Configure the webapp** for your networks:
```bash
cd webapp
export HARDHAT_PRIVATE_KEY="0x..."  # For forked network transactions
npm install && npm run dev
```

3. **Deploy tokens** using the webapp interface on forked networks

4. **Index the transactions**:
```bash
cd indexer
# Configure firehose to point to your forked network
# Substreams will automatically index deployed transactions
```

5. **Replay on actual networks**:
```bash
cd replayer
# Configure for actual networks (mainnet, polygon, etc.)
pnpm replay ./indexed-transactions.yaml
```

### Development Workflow

1. **Test on Forked Networks**: Use orchestrator + webapp with `HARDHAT_PRIVATE_KEY`
2. **Index Transactions**: Capture all transaction data with the indexer
3. **Replay on Actual Networks**: Use replayer with wagmi wallet integration

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Rust toolchain (for indexer)
- Docker (for firehose and orchestrator)
- Kurtosis CLI (for orchestrator)

## Environment Variables

- `HARDHAT_PRIVATE_KEY`: Required for webapp forked network transactions
- `ETHERSCAN_KEY`: Required for indexer ABI fetching
- `NEXT_PUBLIC_CCIP_CONFIG_FILE`: Optional webapp network config path

## License

MIT License - see [LICENSE](LICENSE) file for details.
