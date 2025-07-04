import { http, createConfig, Config } from "wagmi";
import {
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  bscTestnet,
  optimismSepolia,
  polygonAmoy,
  sepolia,
  hederaTestnet,
} from "viem/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";



export const customHederaTestnet = defineChain({
  id: 379103,
  name: "Custom Testnet", // Changed from "Hedera Testnet" to avoid triggering Hedera-specific logic
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://2c500bb941b14a9a862964363a5dfc4f-rpc.network.bloctopus.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "blockscout",
      url: "https://2c500bb941b14a9a862964363a5dfc4f-faucet.network.bloctopus.io",
    },
  },
  testnet: true,
});

export const wagmiConfig: Config = createConfig({
  chains: [
    hederaTestnet,
    arbitrumSepolia,
    avalancheFuji,
    baseSepolia,
    bscTestnet,
    sepolia,
    optimismSepolia,
    polygonAmoy,
    customHederaTestnet,
  ],
  connectors: [injected()],
  transports: {
    [hederaTestnet.id]: http(),
    [arbitrumSepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [baseSepolia.id]: http(),
    [bscTestnet.id]: http(),
    [sepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [customHederaTestnet.id]: http(),
  },
});


