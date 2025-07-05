'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDynamicWagmiConfig } from '@/config/dynamicWagmiConfig';
import { getDynamicNetworkConfig } from '@/config/dynamicNetworkConfig';
import { Config } from 'wagmi';

const queryClient = new QueryClient();

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfigs() {
      try {
        // Load both network config and wagmi config
        const [networkConfig, wagmiCfg] = await Promise.all([
          getDynamicNetworkConfig(),
          getDynamicWagmiConfig(),
        ]);
        
        setWagmiConfig(wagmiCfg);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load configuration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        setIsLoading(false);
      }
    }

    loadConfigs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !wagmiConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Configuration Error</p>
          <p>{error || 'Failed to load configuration'}</p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
} 