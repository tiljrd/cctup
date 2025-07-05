# CCIP UI

A Next.js application for Cross-Chain Interoperability Protocol (CCIP) with dynamic, configurable chain support.

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Dynamic Configuration

The application now supports dynamic loading of network configurations from YAML files at runtime. This allows you to:

- Add new networks without recompiling
- Modify RPC endpoints, contract addresses, and chain configurations
- Deploy the same build with different configurations
- Support custom/private chains easily

#### Configuration Structure

Create a YAML file with the following structure:

```yaml
networks:
  - id: 11155111              # Chain ID (required)
    key: "sepolia"            # Unique key for reference (required)
    name: "Sepolia"           # Display name (required)
    nativeCurrency:
      name: "Ethereum"
      symbol: "ETH"
      decimals: 18
    rpcUrls:                  # List of RPC endpoints
      - "https://ethereum-sepolia.publicnode.com"
    blockExplorer:
      name: "Etherscan"
      url: "https://sepolia.etherscan.io"
    logoURL: "https://..."    # Network logo
    testnet: true
    chainSelector: "16015286601757825753"  # CCIP chain selector
    linkContract: "0x779..."               # LINK token address
    routerAddress: "0x0BF..."              # CCIP router address

tokens:
  - symbol: "CCIP-BnM"
    logoURL: "https://..."
    tags: ["chainlink", "default"]
    addresses:              # Use network keys from above
      sepolia: "0xFd57..."
      polygonAmoy: "0xcab..."
```

#### Using Custom Configuration

1. **Default Configuration**: Place your configuration at `/public/network-config.yaml`

2. **Custom Configuration Path**: Set the environment variable:
   ```bash
   NEXT_PUBLIC_CCIP_CONFIG_FILE=/custom-config.yaml npm run dev
   ```

3. **Multiple Configurations**: Create different YAML files for different environments:
   ```bash
   # Development
   NEXT_PUBLIC_CCIP_CONFIG_FILE=/dev-config.yaml npm run dev
   
   # Production
   NEXT_PUBLIC_CCIP_CONFIG_FILE=/prod-config.yaml npm run build
   ```

### Docker Deployment

The application loads configuration from YAML files served as static assets:

```bash
# Option 1: Build with custom config path
docker build --build-arg NEXT_PUBLIC_CCIP_CONFIG_FILE=/custom.yaml -t ccip-ui .
docker run -p 3000:3000 -v $(pwd)/my-config.yaml:/app/public/custom.yaml:ro ccip-ui

# Option 2: Mount config at runtime (default path)
docker build -t ccip-ui .
docker run -p 3000:3000 \
  -v $(pwd)/my-config.yaml:/app/public/network-config.yaml:ro \
  ccip-ui

# Option 3: Different config file with environment variable
docker run -p 3000:3000 \
  -v $(pwd)/staging.yaml:/app/public/staging.yaml:ro \
  -e NEXT_PUBLIC_CCIP_CONFIG_FILE=/staging.yaml \
  ccip-ui
```

### Adding Custom Networks

To add a custom network:

1. Add the network definition to your YAML file:
   ```yaml
   networks:
     - id: 123456            # Your chain ID
       key: "mychain"
       name: "My Custom Chain"
       nativeCurrency:
         name: "My Token"
         symbol: "MTK"
         decimals: 18
       rpcUrls:
         - "https://rpc.mychain.com"
       blockExplorer:
         name: "My Explorer"
         url: "https://explorer.mychain.com"
       logoURL: "https://mychain.com/logo.png"
       testnet: true
       chainSelector: "1234567890"     # CCIP chain selector if available
       linkContract: "0x..."           # LINK token address if deployed
       routerAddress: "0x..."          # CCIP router if deployed
   ```

2. Add token addresses for your network:
   ```yaml
   tokens:
     - symbol: "CCIP-BnM"
       addresses:
         mychain: "0x..."  # Use the key from network definition
   ```

### Configuration API

For programmatic access to configurations:

```typescript
import { getDynamicNetworkConfig } from '@/config/dynamicNetworkConfig';
import { getDynamicWagmiConfig } from '@/config/dynamicWagmiConfig';

// In an async context
const networkConfig = await getDynamicNetworkConfig();
const wagmiConfig = await getDynamicWagmiConfig();
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Environment Variables

- `NEXT_PUBLIC_CCIP_CONFIG_FILE` - Path to the YAML configuration file (default: `/network-config.yaml`)

## Troubleshooting

### Configuration Not Loading

1. Check that your YAML file is valid:
   ```bash
   npx js-yaml your-config.yaml
   ```

2. Ensure the file is in the `public` directory and accessible via HTTP

3. Check browser console for specific error messages

### Custom Chain Not Working

1. Verify all required fields are present in the YAML
2. Ensure chain ID is unique and correct
3. Check that RPC URLs are accessible
4. Verify contract addresses are correct for your network

## Examples

See `/public/network-config.yaml` for a complete example configuration including all supported testnets.
