import type { NetworkConfig as ReplayerNetworkConfig, ReplayerConfig } from '@cct-up/transaction-replayer';
import type { Chain } from 'viem';

export function convertChainToReplayerNetwork(
  chain: Chain,
  signer?: any
): ReplayerNetworkConfig {
  const rpcUrl = chain.rpcUrls.default.http[0];
  
  return {
    chainId: chain.id,
    rpcUrl: rpcUrl,
    signer: signer || {
      type: 'env-private-key',
      envVar: `CHAIN_${chain.id}_PRIVATE_KEY`
    }
  };
}

export function createReplayerConfig(
  chains: Chain[],
  signers?: Record<number, any>
): ReplayerConfig {
  const networks: Record<string, ReplayerNetworkConfig> = {};
  
  for (const chain of chains) {
    // Use chain name as the network key
    const networkKey = chain.name.toLowerCase().replace(/\s+/g, '-');
    networks[networkKey] = convertChainToReplayerNetwork(
      chain,
      signers?.[chain.id]
    );
  }
  
  return { networks };
} 