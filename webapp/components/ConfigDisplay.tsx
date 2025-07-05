'use client';

import { useEffect, useState } from 'react';
import { getDynamicNetworkConfig } from '@/config/dynamicNetworkConfig';
import { NetworkConfig } from '@chainlink/ccip-react-components';

export function ConfigDisplay() {
  const [config, setConfig] = useState<NetworkConfig | null>(null);
  const [configPath, setConfigPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const networkConfig = await getDynamicNetworkConfig();
        setConfig(networkConfig);
        setConfigPath(process.env.NEXT_PUBLIC_CCIP_CONFIG_FILE || '/network-config.yaml');
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (!config) {
    return <div>Failed to load configuration</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Current Configuration</h3>
      <p className="text-sm text-gray-600 mb-4">Loaded from: {configPath}</p>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium">Networks ({config.chains.length})</h4>
          <ul className="list-disc list-inside text-sm">
            {config.chains.map((chain) => (
              <li key={chain.chain.id}>
                {chain.chain.name} (ID: {chain.chain.id})
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium">Tokens ({config.tokensList.length})</h4>
          <ul className="list-disc list-inside text-sm">
            {config.tokensList.map((token) => (
              <li key={token.symbol}>{token.symbol}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 