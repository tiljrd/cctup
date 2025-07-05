# CCTUP Indexer

An EVM chain indexing solution with record and replay capabilities for blockchain transaction analysis and monitoring.

## Overview

The CCTUP Indexer is a comprehensive blockchain indexing system designed to extract, classify, decode, and persist Ethereum transaction data. It provides a complete pipeline from raw blockchain data to queryable, structured records with ABI-decoded transaction details.

## Architecture

The indexer consists of three main components working together:

### 🦀 Substreams (Rust)
**Location**: `./substreams/`

The core data extraction engine built with Substreams technology. This component:
- Connects directly to Ethereum nodes to stream block data
- Classifies transactions into categories (contract creation, ETH transfer, contract calls, etc.)
- Extracts raw transaction data including gas parameters, access lists, and input data
- Outputs structured transaction records for downstream processing

**Key Features**:
- Real-time blockchain data streaming
- Transaction classification with 6 distinct types
- Efficient Rust-based processing
- Protocol buffer-based data serialization

### 📊 Subgraph (TypeScript)
**Location**: `./subgraph/`

A Graph Protocol-based indexing layer that persists transaction data. This component:
- Receives structured data from the Substreams component
- Stores transaction records in a queryable GraphQL database
- Provides a GraphQL API for accessing indexed data
- Handles both raw transaction data and decoded function calls

**Key Features**:
- GraphQL query interface
- Persistent data storage
- Scalable indexing infrastructure
- Support for decoded transaction data

### 🔧 Scripts (TypeScript)
**Location**: `./scripts/`

Utility scripts for transaction enhancement and ABI management. This component:
- Fetches contract ABIs from Etherscan
- Decodes transaction input data using retrieved ABIs
- Enhances transaction records with human-readable function signatures
- Supports replay file processing for batch operations

**Key Features**:
- Automatic ABI fetching from Etherscan
- Transaction data decoding
- Batch processing capabilities
- Replay file format support

## Prerequisites

Before setting up the indexer, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Rust toolchain** (latest stable)
- **Graph CLI** (`npm install -g @graphprotocol/graph-cli`)
- **Substreams CLI** (follow [Substreams installation guide](https://substreams.streamingfast.io/getting-started/installing-the-cli))

## Setup

### 1. Install Dependencies

From the indexer root directory:

```bash
# Install all workspace dependencies
pnpm install
```

### 2. Environment Configuration

Create environment files for the scripts component:

```bash
# Copy the example environment file
cp scripts/.env.example scripts/.env

# Edit the environment file with your API keys
# Required: ETHERSCAN_KEY for ABI fetching
```

### 3. Build All Components

```bash
# Build all components
pnpm build
```

This will:
- Compile the Rust substreams module
- Generate TypeScript types for the subgraph
- Build the scripts utilities

### 4. Component-Specific Setup

#### Substreams Setup

```bash
cd substreams

# Build the substreams package
cargo build --release

# Package for deployment
substreams pack
```

#### Subgraph Setup

```bash
cd subgraph

# Generate types from schema and substreams
pnpm codegen

# Build the subgraph
pnpm build
```

For local development with a Graph Node:

```bash
# Create local subgraph
pnpm create-local

# Deploy to local node
pnpm deploy-local
```

#### Scripts Setup

```bash
cd scripts

# Build TypeScript
pnpm build

# Ensure environment variables are set
echo $ETHERSCAN_KEY  # Should output your API key
```

## Usage

### Basic Workflow

1. **Start the Substreams**: Extract and classify transactions from the blockchain
2. **Deploy the Subgraph**: Index the transaction data for querying
3. **Run Scripts**: Enhance transactions with ABI decoding as needed

### Running the Substreams

#### Option 1: Using StreamingFast Endpoints

```bash
cd substreams

# Run against mainnet (requires endpoint configuration)
substreams run map_transactions -e mainnet.eth.streamingfast.io:443

# Run with specific block range
substreams run map_transactions -s 18000000 -t 18000100
```

#### Option 2: Using Firehose with RPC Polling

For environments where you don't have access to StreamingFast endpoints or want to use your own RPC provider, you can run firehose in RPC polling mode. This approach uses external RPC endpoints instead of running a full instrumented Ethereum node.

##### Prerequisites for Firehose RPC Polling

- Docker installed and running
- Access to an Ethereum RPC endpoint (Alchemy, Infura, etc.)

##### Setup Firehose with RPC Polling

1. **Pull the Firehose Docker Image**:
```bash
cd substreams
docker pull ghcr.io/streamingfast/firehose-ethereum:40d5054
```

2. **Start Firehose with RPC Polling**:
```bash
# Start firehose container with RPC polling configuration
docker run --rm -d --name firehose-rpc -p 13042:13042 \
  ghcr.io/streamingfast/firehose-ethereum:40d5054 \
  start firehose \
  --substreams-enabled \
  --substreams-rpc-endpoints="https://eth-mainnet.g.alchemy.com/v2/lC2HDPB2Vs7-p-UPkgKD-VqFulU5elyk" \
  --firehose-grpc-listen-addr=":13042" \
  --common-first-streamable-block=19000000 \
  --common-chain-id=1 \
  --common-network-id=1
```

3. **Run Substreams Against Local Firehose**:
```bash
# Run your substream against the local firehose instance
substreams run map_transactions -e localhost:13042 --plaintext

# Run with specific block range
substreams run map_transactions -e localhost:13042 --plaintext -s 19000000 -t 19000100
```

4. **Stop Firehose Container** (when done):
```bash
docker stop firehose-rpc
```

##### Configuration Options

The firehose configuration supports several important parameters:

- `--substreams-rpc-endpoints`: The RPC endpoint URL for blockchain data
- `--common-first-streamable-block`: Starting block number (set to recent block for faster startup)
- `--common-chain-id`: Ethereum chain ID (1 for mainnet)
- `--common-network-id`: Ethereum network ID (1 for mainnet)
- `--firehose-grpc-listen-addr`: Address where firehose listens for gRPC connections

##### Using Custom RPC Endpoints

To use a different RPC provider, replace the `--substreams-rpc-endpoints` value:

```bash
# Example with Infura
--substreams-rpc-endpoints="https://mainnet.infura.io/v3/YOUR_PROJECT_ID"

# Example with local node
--substreams-rpc-endpoints="http://localhost:8545"
```

##### Troubleshooting Firehose RPC Polling

**Container fails to start**:
- Check if port 13042 is already in use: `docker ps | grep 13042`
- Verify Docker is running: `docker version`

**RPC connection issues**:
- Verify the RPC endpoint is accessible: `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' YOUR_RPC_ENDPOINT`
- Check rate limits on your RPC provider
- Ensure the RPC endpoint supports the required methods

**Substreams connection fails**:
- Verify firehose is running: `docker logs firehose-rpc`
- Check that port 13042 is accessible: `telnet localhost 13042`
- Ensure you're using `--plaintext` flag when connecting to local firehose

### Querying the Subgraph

Once deployed, query the GraphQL endpoint:

```graphql
{
  transactions(first: 10, orderBy: id) {
    id
    kind
    from
    to
    value
    gasLimit
    fnSig
    args
    abiSource
  }
}
```

### Using the Scripts

#### Fetch and Decode Transaction Data

```bash
cd scripts

# Process a replay file with ABI decoding
pnpm fetch-abi

# This will:
# 1. Read replay.json from the current directory
# 2. Fetch ABIs for contract addresses from Etherscan
# 3. Decode transaction input data
# 4. Update the replay file with decoded information
```

#### Custom ABI Fetching

```typescript
import { fetchAbiFromEtherscan, decodeTransactionData } from './fetchAbi.js';

// Fetch ABI for a specific contract
const abi = await fetchAbiFromEtherscan('0x...');

// Decode transaction data
await decodeTransactionData(transactionObject);
```

## Data Flow

```
Ethereum Blockchain
        ↓
   Substreams (Rust)
   - Extract blocks
   - Classify transactions
   - Structure data
        ↓
   Subgraph (TypeScript)
   - Index transactions
   - Store in GraphQL DB
   - Provide query API
        ↓
   Scripts (TypeScript)
   - Fetch ABIs
   - Decode function calls
   - Enhance data
```

## Transaction Classification

The indexer classifies transactions into the following types:

- **`contractCreation`**: Transactions that deploy new contracts
- **`ethTransfer`**: Simple ETH transfers between EOAs
- **`ethTransferToContract`**: ETH transfers to contract addresses
- **`contractCallWithData`**: Contract function calls with input data
- **`contractCallNoData`**: Contract calls without input data
- **`precompileCall`**: Calls to Ethereum precompiled contracts

## Configuration

### Substreams Configuration

Edit `substreams/substreams.yaml` to configure:
- Network endpoints
- Block ranges
- Output modules

### Subgraph Configuration

Edit `subgraph/subgraph.yaml` to configure:
- Data source networks
- Substreams package location
- GraphQL schema

### Scripts Configuration

Environment variables in `scripts/.env`:
- `ETHERSCAN_KEY`: Required for ABI fetching
- Additional API keys for other block explorers (future)

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run component-specific tests
cd subgraph && pnpm test
cd scripts && pnpm test
```

### Linting

```bash
# Lint all components
pnpm lint

# Fix linting issues
pnpm lint --fix
```

### Local Development

For local development, you'll need:
1. A local Graph Node instance
2. IPFS node
3. Ethereum node or endpoint access

See the [Graph Node documentation](https://github.com/graphprotocol/graph-node) for setup instructions.

## Troubleshooting

### Common Issues

**Substreams build fails**:
- Ensure Rust toolchain is installed and up to date
- Check that protobuf compiler is available
- Verify substreams CLI is properly installed

**Subgraph deployment fails**:
- Ensure Graph Node is running and accessible
- Check that the substreams package exists and is built
- Verify network configuration in subgraph.yaml

**ABI fetching fails**:
- Verify ETHERSCAN_KEY is set and valid
- Check rate limits on Etherscan API
- Ensure network connectivity

### Getting Help

- Check the [Substreams documentation](https://substreams.streamingfast.io/)
- Review [The Graph documentation](https://thegraph.com/docs/)
- Open an issue in the repository for project-specific problems

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
