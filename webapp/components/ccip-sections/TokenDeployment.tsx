"use client";

import { useState, useEffect } from "react";
import { loadForkedNetworks } from '@/config/unifiedConfigLoader';

interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  poolAddress?: string;
  transactionHash?: string;
  error?: string;
  stdout?: string;
  stderr?: string;
}

interface NetworkOption {
  key: string;
  name: string;
  chainSelector: string;
  testnet: boolean;
}

// Hook to load available networks from YAML
function useAvailableNetworks() {
  const [networks, setNetworks] = useState<NetworkOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNetworks() {
      try {
        const forkedNetworks = await loadForkedNetworks();
        
        const networkOptions = forkedNetworks.map((network) => ({
          key: network.key,
          name: network.name,
          chainSelector: network.chainSelector || '',
          testnet: network.testnet || false
        }));
        
        setNetworks(networkOptions);
      } catch (error) {
        console.error('Failed to load networks:', error);
        // Fallback networks matching your YAML structure
        setNetworks([
          { key: 'sepolia', name: 'Sepolia', chainSelector: '16015286601757825753', testnet: true },
          { key: 'arbitrumSepolia', name: 'Arbitrum Sepolia', chainSelector: '3478487238524512106', testnet: true },
          { key: 'polygonAmoy', name: 'Polygon Amoy', chainSelector: '16281711391670634445', testnet: true },
          { key: 'baseSepolia', name: 'Base Sepolia', chainSelector: '10344971235874465080', testnet: true },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadNetworks();
  }, []);

  return { networks, loading };
}

// Network selector component
interface NetworkSelectorProps {
  value: string;
  onChange: (value: string) => void;
  focusColor?: string;
  disabled?: boolean;
}

function NetworkSelector({ value, onChange, focusColor = 'blue', disabled = false }: NetworkSelectorProps) {
  const { networks, loading } = useAvailableNetworks();

  if (loading) {
    return (
      <select
        className="border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-500"
        disabled
      >
        <option>Loading networks...</option>
      </select>
    );
  }

  return (
    <select
      className={`border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-${focusColor}-500 focus:border-${focusColor}-500 ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">Select Network</option>
      {networks.map((network) => (
        <option key={network.key} value={network.key}>
          {network.key} ({network.chainSelector})
        </option>
      ))}
    </select>
  );
}

export function DeployToken() {
  const [formData, setFormData] = useState({
    network: '',
    name: '',
    symbol: '',
    decimals: '18',
    supply: '1000000',
    mint: '',
    recipient: '',
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [result, setResult] = useState<DeploymentResult | null>(null);

  const handleDeploy = async () => {
    if (!formData.network || !formData.name || !formData.symbol) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    setIsDeploying(true);
    setResult(null);

    try {
      const response = await fetch('/api/hardhat/deploy-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-6 bg-white shadow-sm">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="ml-3 text-lg font-semibold text-gray-900">Deploy Burnable Token</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Network*</label>
          <NetworkSelector
            value={formData.network}
            onChange={(network) => setFormData({ ...formData, network })}
            focusColor="blue"
            disabled={isDeploying}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Token Name*</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="My Token"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Symbol*</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="MTK"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Decimals</label>
          <input
            type="number"
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.decimals}
            onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Total Supply</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1000000"
            value={formData.supply}
            onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Initial Mint (optional)</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1000"
            value={formData.mint}
            onChange={(e) => setFormData({ ...formData, mint: e.target.value })}
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1">Recipient (optional)</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0x... (defaults to deployer)"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          />
        </div>

      </div>

      <button
        className="w-full rounded-md p-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
        onClick={handleDeploy}
        disabled={isDeploying}
      >
        {isDeploying ? 'Deploying...' : 'Deploy Token'}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded-md">
          {result.success ? (
            <div className="text-green-600">
              <p className="font-semibold">✅ Success!</p>
              {result.contractAddress && (
                <p className="mt-2">
                  <span className="font-medium">Contract Address:</span> 
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">{result.contractAddress}</code>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">Token Deployment Failed</h4>
                  <p className="text-red-700">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SetupBurnMintPool() {
  const [formData, setFormData] = useState({
    network: '',
    token: ''
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [result, setResult] = useState<DeploymentResult | null>(null);

  const handleSetup = async () => {
    if (!formData.network || !formData.token) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    setIsDeploying(true);
    setResult(null);

    try {
      const response = await fetch('/api/hardhat/setup-burn-mint-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-6 bg-white shadow-sm">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="ml-3 text-lg font-semibold text-gray-900">Setup Burn and Mint (BnM) Pool</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Network*</label>
          <NetworkSelector
            value={formData.network}
            onChange={(network) => setFormData({ ...formData, network })}
            focusColor="green"
            disabled={isDeploying}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Token Address*</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="0x..."
            value={formData.token}
            onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          />
        </div>

      </div>

      <button
        className="w-full rounded-md p-3 bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium"
        onClick={handleSetup}
        disabled={isDeploying}
      >
        {isDeploying ? 'Setting up...' : 'Setup Burn Mint Pool'}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded-md">
          {result.success ? (
            <div className="text-green-600">
              <p className="font-semibold">✅ Success!</p>
              {result.poolAddress && (
                <p className="mt-2">
                  <span className="font-medium">Pool Address:</span> 
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">{result.poolAddress}</code>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">Pool Setup Failed</h4>
                  <p className="text-red-700">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SetupLockReleasePool() {
  const [formData, setFormData] = useState({
    network: '',
    token: '',
    liquidity: ''
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [result, setResult] = useState<DeploymentResult | null>(null);

  const handleSetup = async () => {
    if (!formData.network || !formData.token) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    setIsDeploying(true);
    setResult(null);

    try {
      const response = await fetch('/api/hardhat/setup-lock-release-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-6 bg-white shadow-sm">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="ml-3 text-lg font-semibold text-gray-900">Setup Lock and Release (LnR) Pool</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Network*</label>
          <NetworkSelector
            value={formData.network}
            onChange={(network) => setFormData({ ...formData, network })}
            focusColor="purple"
            disabled={isDeploying}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Token Address*</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="0x..."
            value={formData.token}
            onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Initial Liquidity (optional)</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="1000"
            value={formData.liquidity}
            onChange={(e) => setFormData({ ...formData, liquidity: e.target.value })}
          />
        </div>
      </div>

      <button
        className="w-full rounded-md p-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:bg-gray-400 font-medium"
        onClick={handleSetup}
        disabled={isDeploying}
      >
        {isDeploying ? 'Setting up...' : 'Setup Lock Release Pool'}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded-md">
          {result.success ? (
            <div className="text-green-600">
              <p className="font-semibold">✅ Success!</p>
              {result.poolAddress && (
                <p className="mt-2">
                  <span className="font-medium">Pool Address:</span> 
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">{result.poolAddress}</code>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">Pool Setup Failed</h4>
                  <p className="text-red-700">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfigurePool() {
  const [formData, setFormData] = useState({
    network: '',
    localPool: '',
    remoteNetwork: '',
    remotePool: '',
    remoteToken: '',
    poolType: 'burnMint',
  });
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [result, setResult] = useState<DeploymentResult | null>(null);

  const handleConfigure = async () => {
    if (!formData.network || !formData.localPool || !formData.remoteNetwork || 
        !formData.remotePool || !formData.remoteToken) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    setIsConfiguring(true);
    setResult(null);

    try {
      const response = await fetch('/api/hardhat/configure-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-6 bg-white shadow-sm">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="ml-3 text-lg font-semibold text-gray-900">Configure Pool</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Local Network*</label>
          <NetworkSelector
            value={formData.network}
            onChange={(network) => setFormData({ ...formData, network })}
            focusColor="orange"
            disabled={isConfiguring}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Local Pool Address*</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="0x..."
            value={formData.localPool}
            onChange={(e) => setFormData({ ...formData, localPool: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Remote Network*</label>
          <NetworkSelector
            value={formData.remoteNetwork}
            onChange={(remoteNetwork) => setFormData({ ...formData, remoteNetwork })}
            focusColor="orange"
            disabled={isConfiguring}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Remote Pool Address*</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="0x..."
            value={formData.remotePool}
            onChange={(e) => setFormData({ ...formData, remotePool: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Remote Token Address*</label>
          <input
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="0x..."
            value={formData.remoteToken}
            onChange={(e) => setFormData({ ...formData, remoteToken: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Pool Type*</label>
          <select
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={formData.poolType}
            onChange={(e) => setFormData({ ...formData, poolType: e.target.value })}
          >
            <option value="burnMint">Burn Mint</option>
            <option value="lockRelease">Lock Release</option>
          </select>
        </div>
      </div>

      <button
        className="w-full rounded-md p-3 bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:bg-gray-400 font-medium"
        onClick={handleConfigure}
        disabled={isConfiguring}
      >
        {isConfiguring ? 'Configuring...' : 'Configure Pool'}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded-md">
          {result.success ? (
            <div className="text-green-600">
              <p className="font-semibold">✅ Configuration Success!</p>
              <p className="mt-1 text-sm">Pool has been configured for cross-chain communication.</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">Configuration Failed</h4>
                  <p className="text-red-700">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 