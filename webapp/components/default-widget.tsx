'use client';

import '@chainlink/ccip-react-components/dist/style.css';
import { CCIPWidget } from '@chainlink/ccip-react-components';
import { useEffect, useState } from 'react';
import { config } from '@/config';
import { getDynamicNetworkConfig } from '@/config/dynamicNetworkConfig';
import { NetworkConfig } from '@chainlink/ccip-react-components';

export function DefaultWidget() {
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getDynamicNetworkConfig();
        setNetworkConfig(config);
      } catch (error) {
        console.error('Failed to load network configuration:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!networkConfig) {
    return (
      <div className="text-center text-red-600 p-8">
        Failed to load network configuration
      </div>
    );
  }

  return <CCIPWidget config={config} networkConfig={networkConfig} />;
}
