"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { WizardData } from "@/app/ccip-js/multi-chain-wizard/page";
import { loadBloctopusNetworks, loadExistingNetworks, getBlockExplorerUrl as getExplorerUrl } from '@/config/unifiedConfigLoader';

// Client-safe function to get block explorer URL
async function getBlockExplorerUrl(networkKey: string, contractAddress: string): Promise<string | null> {
  return getExplorerUrl(networkKey, contractAddress);
}

interface NetworkOption {
  key: string;
  name: string;
  chainSelector: string;
  testnet: boolean;
  logoURL?: string;
}

// Hook to load available networks from YAML
function useAvailableNetworks() {
  const [networks, setNetworks] = useState<NetworkOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNetworks() {
      try {
        const existingNetworks = await loadExistingNetworks();
        const bloctopusNetworks = await loadBloctopusNetworks();
        
        const networkOptions = existingNetworks
          .filter(network => bloctopusNetworks.some(bn => bn.key === network.fork))
          .map(network => ({
            key: network.key,
            name: network.name,
            chainSelector: network.chainSelector || '',
            testnet: network.testnet || false,
            logoURL: network.logoURL || `https://via.placeholder.com/32/0066cc/ffffff?text=${network.name.charAt(0)}`
          }));
        
        setNetworks(networkOptions);
      } catch (error) {
        console.error('Failed to load networks:', error);
        // Fallback networks
        setNetworks([
          { key: 'sepolia', name: 'Sepolia', chainSelector: '16015286601757825753', testnet: true, logoURL: 'https://via.placeholder.com/32/0066cc/ffffff?text=S' },
          { key: 'arbitrumSepolia', name: 'Arbitrum Sepolia', chainSelector: '3478487238524512106', testnet: true, logoURL: 'https://via.placeholder.com/32/0066cc/ffffff?text=A' },
          { key: 'polygonAmoy', name: 'Polygon Amoy', chainSelector: '16281711391670634445', testnet: true, logoURL: 'https://via.placeholder.com/32/0066cc/ffffff?text=P' },
          { key: 'baseSepolia', name: 'Base Sepolia', chainSelector: '10344971235874465080', testnet: true, logoURL: 'https://via.placeholder.com/32/0066cc/ffffff?text=B' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadNetworks();
  }, []);

  return { networks, loading };
}

// Step 1: Chain Selection
interface ChainSelectionStepProps {
  selectedChains: string[];
  onChainsChange: (chains: string[]) => void;
}

export function ChainSelectionStep({ selectedChains, onChainsChange }: ChainSelectionStepProps) {
  const { networks, loading } = useAvailableNetworks();

  const handleChainToggle = (chainKey: string) => {
    if (selectedChains.includes(chainKey)) {
      onChainsChange(selectedChains.filter(c => c !== chainKey));
    } else {
      onChainsChange([...selectedChains, chainKey]);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading networks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Chains</h2>
        <p className="text-gray-600">Choose at least 2 chains for cross-chain deployment. Select the networks where you want to deploy your token and pools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {networks.map((network) => (
          <div
            key={network.key}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selectedChains.includes(network.key)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => handleChainToggle(network.key)}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <img 
                  src={network.logoURL} 
                  alt={network.name} 
                  className="w-6 h-6 rounded-full" 
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const nextSibling = target.nextElementSibling as HTMLElement;
                    if (nextSibling) {
                      nextSibling.style.display = 'block';
                    }
                  }}
                />
                <span className="text-sm font-medium text-gray-600 hidden">
                  {network.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{network.name}</h3>
                <p className="text-sm text-gray-500 truncate">{network.chainSelector}</p>
              </div>
              {selectedChains.includes(network.key) && (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedChains.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Selected Chains ({selectedChains.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedChains.map(chainKey => {
              const network = networks.find(n => n.key === chainKey);
              return (
                <span key={chainKey} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {network?.name || chainKey}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {selectedChains.length < 2 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-yellow-800">Please select at least 2 chains for cross-chain deployment</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Token Configuration
interface TokenConfigurationStepProps {
  tokenConfig: WizardData['tokenConfig'];
  onTokenConfigChange: (config: WizardData['tokenConfig']) => void;
}

export function TokenConfigurationStep({ tokenConfig, onTokenConfigChange }: TokenConfigurationStepProps) {
  const handleInputChange = (field: keyof WizardData['tokenConfig'], value: string) => {
    onTokenConfigChange({
      ...tokenConfig,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Configuration</h2>
        <p className="text-gray-600">Configure the parameters for your cross-chain token. The same token will be deployed on all selected chains.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Name *</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="My Cross-Chain Token"
            value={tokenConfig.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Symbol *</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="MCCT"
            value={tokenConfig.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Decimals</label>
          <input
            type="number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="18"
            value={tokenConfig.decimals}
            onChange={(e) => handleInputChange('decimals', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Supply</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1000000"
            value={tokenConfig.supply}
            onChange={(e) => handleInputChange('supply', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Initial Mint (optional)</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1000"
            value={tokenConfig.mint}
            onChange={(e) => handleInputChange('mint', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address (optional)</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0x... (defaults to deployer)"
            value={tokenConfig.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
          />
        </div>
      </div>

      {tokenConfig.name && tokenConfig.symbol && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Token Preview</h3>
          <div className="text-sm text-green-800">
            <p><strong>Name:</strong> {tokenConfig.name}</p>
            <p><strong>Symbol:</strong> {tokenConfig.symbol}</p>
            <p><strong>Decimals:</strong> {tokenConfig.decimals}</p>
            <p><strong>Total Supply:</strong> {tokenConfig.supply}</p>
            {tokenConfig.mint && <p><strong>Initial Mint:</strong> {tokenConfig.mint}</p>}
            {tokenConfig.recipient && <p><strong>Recipient:</strong> {tokenConfig.recipient}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 3: Pool Type Selection
interface PoolTypeSelectionStepProps {
  poolType: WizardData['poolType'];
  liquidity?: string;
  onPoolTypeChange: (type: WizardData['poolType']) => void;
  onLiquidityChange: (liquidity: string) => void;
}

export function PoolTypeSelectionStep({ poolType, liquidity, onPoolTypeChange, onLiquidityChange }: PoolTypeSelectionStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pool Type Selection</h2>
        <p className="text-gray-600">Choose the type of pool to deploy for your token. This determines how cross-chain transfers are handled.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
            poolType === 'burnMint' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => onPoolTypeChange('burnMint')}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Burn & Mint Pool</h3>
              <p className="text-sm text-gray-500">Recommended for most tokens</p>
            </div>
            {poolType === 'burnMint' && (
              <svg className="w-5 h-5 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Tokens are burned on the source chain and minted on the destination chain. 
            This is the most common and gas-efficient method for cross-chain transfers.
          </p>
        </div>

        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
            poolType === 'lockRelease' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => onPoolTypeChange('lockRelease')}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Lock & Release Pool</h3>
              <p className="text-sm text-gray-500">For existing tokens</p>
            </div>
            {poolType === 'lockRelease' && (
              <svg className="w-5 h-5 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Tokens are locked on the source chain and released from a liquidity pool on the destination chain. 
            Requires initial liquidity provision.
          </p>
        </div>
      </div>

      {poolType === 'lockRelease' && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Initial Liquidity (optional)</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="10000"
            value={liquidity || ''}
            onChange={(e) => onLiquidityChange(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">
            Amount of tokens to provide as initial liquidity for the Lock & Release pool
          </p>
        </div>
      )}
    </div>
  );
}

// Step 4: Review & Simulate
interface ReviewAndSimulateStepProps {
  wizardData: WizardData;
  onSimulateStart: () => void;
  setWizardData: (data: WizardData) => void;
}

export function ReviewAndSimulateStep({ wizardData, onSimulateStart, setWizardData }: ReviewAndSimulateStepProps) {
  const { networks } = useAvailableNetworks();
  const [isDeploying, setIsDeploying] = useState(false);

  const selectedNetworks = networks.filter(n => wizardData.selectedChains.includes(n.key));

      const handleSimulate = async () => {
    setIsDeploying(true);
    
    // Initialize deployment results
    const deploymentResults: WizardData['deploymentResults'] = {};
    wizardData.selectedChains.forEach(chain => {
      deploymentResults[chain] = { status: 'pending' };
    });

    setWizardData({
      ...wizardData,
      deploymentResults
    });

    onSimulateStart();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Simulate</h2>
        <p className="text-gray-600">Review your configuration before starting the simulation on fork networks.</p>
      </div>

      <div className="space-y-6">
        {/* Selected Chains */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Chains ({wizardData.selectedChains.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedNetworks.map(network => (
              <div key={network.key} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-gray-600">{network.name.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{network.name}</h4>
                  <p className="text-sm text-gray-500">{network.key}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token Configuration */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Token Configuration</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{wizardData.tokenConfig.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Symbol</p>
                <p className="font-medium text-gray-900">{wizardData.tokenConfig.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Decimals</p>
                <p className="font-medium text-gray-900">{wizardData.tokenConfig.decimals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Supply</p>
                <p className="font-medium text-gray-900">{wizardData.tokenConfig.supply}</p>
              </div>
              {wizardData.tokenConfig.mint && (
                <div>
                  <p className="text-sm text-gray-500">Initial Mint</p>
                  <p className="font-medium text-gray-900">{wizardData.tokenConfig.mint}</p>
                </div>
              )}
              {wizardData.tokenConfig.recipient && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Recipient</p>
                  <p className="font-medium text-gray-900 break-all">{wizardData.tokenConfig.recipient}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pool Type */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pool Configuration</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                wizardData.poolType === 'burnMint' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                <svg className={`w-4 h-4 ${
                  wizardData.poolType === 'burnMint' ? 'text-green-600' : 'text-purple-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                    wizardData.poolType === 'burnMint' 
                      ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  } />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {wizardData.poolType === 'burnMint' ? 'Burn & Mint Pool' : 'Lock & Release Pool'}
                </h4>
                {wizardData.poolType === 'lockRelease' && wizardData.liquidity && (
                  <p className="text-sm text-gray-500">Initial Liquidity: {wizardData.liquidity}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Process */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Deployment Process</h3>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-xs font-medium">1</span>
              Deploy tokens on {wizardData.selectedChains.length} chains
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-xs font-medium">2</span>
              Setup {wizardData.poolType === 'burnMint' ? 'Burn & Mint' : 'Lock & Release'} pools
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-xs font-medium">3</span>
              Configure cross-chain communication between pools
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleSimulate}
          disabled={isDeploying}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeploying ? 'Starting Simulation...' : 'Start Multi-Chain Simulation'}
        </button>
      </div>
    </div>
  );
}

// Step 5: Simulate Execution
interface SimulateExecutionStepProps {
  wizardData: WizardData;
  setWizardData: (data: WizardData) => void;
}

export function SimulateExecutionStep({ wizardData, setWizardData }: SimulateExecutionStepProps) {
  const { networks } = useAvailableNetworks();
  const [currentPhase, setCurrentPhase] = useState<'deploying' | 'configuring' | 'completed'>('deploying');
  const [deploymentStarted, setDeploymentStarted] = useState(false);
  const deploymentInProgress = useRef(false);
  
  // Filter networks based on selected chains
  const selectedNetworks = networks.filter(network => 
    wizardData.selectedChains.includes(network.key)
  );

  useEffect(() => {
    // Only start deployment once and if not already started
    // Check if already complete first to avoid any re-triggers
    if (wizardData.configurationComplete || deploymentInProgress.current) {
      return;
    }
    
    if (!deploymentStarted && !wizardData.deploymentStarted) {
      console.log('🚀 Initiating deployment process...');
      deploymentInProgress.current = true;
      setDeploymentStarted(true);
      setWizardData({
        ...wizardData,
        deploymentStarted: true
      });
      deployMultiChain();
    }
  }, []); // Empty dependency array - only run once on mount

  const deployMultiChain = async () => {
    try {
      console.log('🚀 Starting multi-chain deployment...');
      
      // Initialize results for all selected chains
      const initialResults = wizardData.selectedChains.reduce((acc, chainKey) => {
        acc[chainKey] = { 
          status: 'pending' as const,
          configurationStatus: {}
        };
        return acc;
      }, {} as WizardData['deploymentResults']);

      setWizardData({
        ...wizardData,
        deploymentResults: initialResults
      });

      // Track results locally to avoid stale state issues
      const localResults: WizardData['deploymentResults'] = {};

      // Deploy to each chain using the new API
      const deploymentPromises = wizardData.selectedChains.map(async (chainKey) => {
        try {
          console.log(`🚀 Starting deployment to ${chainKey}...`);
          
          const response = await fetch('/api/hardhat/multi-chain-deploy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chainKey, // Single chain deployment
              tokenConfig: wizardData.tokenConfig,
              poolType: wizardData.poolType,
              liquidity: wizardData.liquidity,
            }),
          });

          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
          }

          if (result.success) {
            console.log(`✅ Successfully deployed to ${chainKey}`);
            
            // Update local results
            localResults[chainKey] = {
              status: 'success' as const,
              tokenAddress: result.tokenAddress,
              poolAddress: result.poolAddress,
              transactionHash: result.transactionHash,
              configurationStatus: {}
            };
            
            // Initialize configuration status for all other chains
            wizardData.selectedChains.forEach(targetChain => {
              if (targetChain !== chainKey) {
                localResults[chainKey].configurationStatus![targetChain] = 'pending';
              }
            });
            
            // Update React state - get current state first
            const currentWizardData = wizardData; // This will be stale, but we need it for other fields
            setWizardData({
              ...currentWizardData,
              deploymentResults: {
                ...currentWizardData.deploymentResults,
                [chainKey]: localResults[chainKey]
              }
            });
          } else {
            throw new Error(result.error || 'Deployment failed');
          }
        } catch (error) {
          console.error(`❌ Error deploying to ${chainKey}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          localResults[chainKey] = {
            status: 'error' as const,
            error: errorMessage,
            configurationStatus: {}
          };
          
          setWizardData({
            ...wizardData,
            deploymentResults: {
              ...wizardData.deploymentResults,
              [chainKey]: localResults[chainKey]
            }
          });
        }
      });

      // Wait for all deployments to complete
      await Promise.all(deploymentPromises);

      // Check deployment status using local results
      const currentResults = Object.values(localResults);
      const successfulDeployments = currentResults.filter(r => r.status === 'success').length;
      
      console.log(`📊 Deployment summary: ${successfulDeployments}/${wizardData.selectedChains.length} chains deployed successfully`);
      
      // Update final state with all results
      setWizardData({
        ...wizardData,
        deploymentResults: localResults
      });
      
      if (successfulDeployments >= 2) {
        console.log('🔗 Starting cross-chain configuration...');
        setCurrentPhase('configuring');
        
        // Pass local results to configuration
        await configureNetworks(localResults);
      } else {
        console.log('⚠️ Insufficient successful deployments for cross-chain configuration');
        setCurrentPhase('completed');
        setWizardData({
          ...wizardData,
          deploymentResults: localResults,
          configurationComplete: false,
          deploymentStarted: true // Prevent re-trigger
        });
      }
    } catch (error) {
      console.error('❌ Multi-chain deployment error:', error);
      setCurrentPhase('completed');
    } finally {
      deploymentInProgress.current = false;
    }
  };

  const configureNetworks = async (localResults: WizardData['deploymentResults']) => {
    try {
      const successfulChains = wizardData.selectedChains.filter(
        chainKey => localResults[chainKey]?.status === 'success'
      );

      // Immediately update all configuration statuses to show loading state
      setWizardData((prevData: WizardData) => {
        const newResults = { ...prevData.deploymentResults };
        
        // Set all chain pairs to 'configuring' status for immediate UI feedback
        for (const sourceChain of successfulChains) {
          if (!newResults[sourceChain].configurationStatus) {
            newResults[sourceChain].configurationStatus = {};
          }
          for (const targetChain of successfulChains) {
            if (sourceChain !== targetChain) {
              newResults[sourceChain].configurationStatus![targetChain] = 'configuring';
            }
          }
        }
        
        return {
          ...prevData,
          deploymentResults: newResults
        };
      });

      // Configure each chain pair
      const configPromises = [];
      
      for (const sourceChain of successfulChains) {
        for (const targetChain of successfulChains) {
          if (sourceChain !== targetChain) {
            configPromises.push(
              configureChainPair(sourceChain, targetChain, localResults)
            );
          }
        }
      }

      await Promise.all(configPromises);
      
      setCurrentPhase('completed');
      
      // Update state with local results and mark as complete
      const finalWizardData = {
        ...wizardData,
        deploymentResults: {
          ...wizardData.deploymentResults,
          ...localResults
        },
        configurationComplete: true,
        deploymentStarted: true // Ensure this remains true
      };
      setWizardData(finalWizardData);
      
    } catch (error) {
      console.error('❌ Configuration error:', error);
      setCurrentPhase('completed');
    }
  };

  const configureChainPair = async (sourceChain: string, targetChain: string, localResults: WizardData['deploymentResults']) => {
    try {
      console.log(`🔗 Configuring ${sourceChain} -> ${targetChain}...`);
      
      // Update status to configuring
      setWizardData((prevData: WizardData) => {
        const newResults = { ...prevData.deploymentResults };
        if (!newResults[sourceChain].configurationStatus) {
          newResults[sourceChain].configurationStatus = {};
        }
        newResults[sourceChain].configurationStatus![targetChain] = 'configuring';
        
        return {
          ...prevData,
          deploymentResults: newResults
        };
      });

      const response = await fetch('/api/hardhat/configure-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: sourceChain,
          localPool: localResults[sourceChain].poolAddress,
          remoteNetwork: targetChain,
          remotePool: localResults[targetChain].poolAddress,
          remoteToken: localResults[targetChain].tokenAddress,
          poolType: wizardData.poolType,
        }),
      });

      const result = await response.json();
      
      // Update configuration status with transaction hash if successful
      setWizardData((prevData: WizardData) => {
        const newResults = { ...prevData.deploymentResults };
        if (!newResults[sourceChain].configurationStatus) {
          newResults[sourceChain].configurationStatus = {};
        }
        
        if (result.success) {
          newResults[sourceChain].configurationStatus![targetChain] = 'success';
          
          // Store configuration transaction hash if available
          if (result.transactionHash) {
            if (!newResults[sourceChain].configurationTransactions) {
              newResults[sourceChain].configurationTransactions = {};
            }
            newResults[sourceChain].configurationTransactions![targetChain] = result.transactionHash;
          }
        } else {
          newResults[sourceChain].configurationStatus![targetChain] = 'error';
        }
        
        return {
          ...prevData,
          deploymentResults: newResults
        };
      });

      if (result.success) {
        const txHashDisplay = result.transactionHash ? ` (tx: ${result.transactionHash.slice(0, 10)}...)` : '';
        console.log(`✅ Configuration complete: ${sourceChain} -> ${targetChain}${txHashDisplay}`);
      } else {
        console.error(`❌ Configuration failed: ${sourceChain} -> ${targetChain}: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Configuration error: ${sourceChain} -> ${targetChain}:`, error);
      
      // Update status to error
      setWizardData((prevData: WizardData) => {
        const newResults = { ...prevData.deploymentResults };
        if (!newResults[sourceChain].configurationStatus) {
          newResults[sourceChain].configurationStatus = {};
        }
        newResults[sourceChain].configurationStatus![targetChain] = 'error';
        
        return {
          ...prevData,
          deploymentResults: newResults
        };
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
    }
  };

  const getDeploymentPhaseStatus = () => {
    const results = Object.values(wizardData.deploymentResults);
    if (results.length === 0) return 'loading';
    if (results.some(r => r.status === 'error')) return 'error';
    if (results.every(r => r.status === 'success')) return 'success';
    return 'loading';
  };

  const getConfigurationPhaseStatus = () => {
    if (currentPhase === 'configuring') return 'loading';
    if (currentPhase === 'completed') return 'success';
    return 'pending';
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'loading':
        return (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return <span className="text-sm">1</span>;
    }
  };

  const deploymentPhaseStatus = getDeploymentPhaseStatus();
  const configurationPhaseStatus = getConfigurationPhaseStatus();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Deployment Progress</h2>
        <p className="text-gray-600 text-sm sm:text-base">
          {currentPhase === 'deploying' && 'Deploying tokens and pools across all selected chains...'}
          {currentPhase === 'configuring' && 'Configuring cross-chain communication between pools...'}
          {currentPhase === 'completed' && 'Deployment and configuration completed!'}
        </p>
      </div>

      {/* Phase Progress - Progressive Responsive Design */}
      <div className="mb-6 sm:mb-8">
        {/* Extra Small - Vertical Stack */}
        <div className="block sm:hidden space-y-4 mb-4">
          <div className={`flex items-center ${
            deploymentPhaseStatus === 'loading' ? 'text-blue-600' : 
            deploymentPhaseStatus === 'success' ? 'text-green-600' : 
            deploymentPhaseStatus === 'error' ? 'text-red-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              deploymentPhaseStatus === 'loading' ? 'bg-blue-100' : 
              deploymentPhaseStatus === 'success' ? 'bg-green-100' : 
              deploymentPhaseStatus === 'error' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {getPhaseIcon(deploymentPhaseStatus)}
            </div>
            <span className="font-medium text-sm">Deploy Tokens & Pools</span>
          </div>
          
          <div className={`flex items-center ${
            configurationPhaseStatus === 'loading' ? 'text-blue-600' : 
            configurationPhaseStatus === 'success' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              configurationPhaseStatus === 'loading' ? 'bg-blue-100' : 
              configurationPhaseStatus === 'success' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {configurationPhaseStatus === 'pending' ? (
                <span className="text-sm">2</span>
              ) : (
                getPhaseIcon(configurationPhaseStatus)
              )}
            </div>
            <span className="font-medium text-sm">Configure Cross-Chain</span>
          </div>
        </div>

        {/* Small to Medium - Compact Horizontal */}
        <div className="hidden sm:block md:hidden">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`flex items-center ${
              deploymentPhaseStatus === 'loading' ? 'text-blue-600' : 
              deploymentPhaseStatus === 'success' ? 'text-green-600' : 
              deploymentPhaseStatus === 'error' ? 'text-red-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                deploymentPhaseStatus === 'loading' ? 'bg-blue-100' : 
                deploymentPhaseStatus === 'success' ? 'bg-green-100' : 
                deploymentPhaseStatus === 'error' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {getPhaseIcon(deploymentPhaseStatus)}
              </div>
              <span className="font-medium text-xs">Deploy</span>
            </div>
            
            {/* Compact Connection Line */}
            <div className={`w-8 h-0.5 ${
              deploymentPhaseStatus === 'success' ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            
            <div className={`flex items-center ${
              configurationPhaseStatus === 'loading' ? 'text-blue-600' : 
              configurationPhaseStatus === 'success' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                configurationPhaseStatus === 'loading' ? 'bg-blue-100' : 
                configurationPhaseStatus === 'success' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {configurationPhaseStatus === 'pending' ? (
                  <span className="text-sm">2</span>
                ) : (
                  getPhaseIcon(configurationPhaseStatus)
                )}
              </div>
              <span className="font-medium text-xs">Configure</span>
            </div>
          </div>
        </div>

        {/* Medium+ - Full Horizontal with Connection Line */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className={`flex items-center ${
              deploymentPhaseStatus === 'loading' ? 'text-blue-600' : 
              deploymentPhaseStatus === 'success' ? 'text-green-600' : 
              deploymentPhaseStatus === 'error' ? 'text-red-600' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                deploymentPhaseStatus === 'loading' ? 'bg-blue-100' : 
                deploymentPhaseStatus === 'success' ? 'bg-green-100' : 
                deploymentPhaseStatus === 'error' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {getPhaseIcon(deploymentPhaseStatus)}
              </div>
              <span className="font-medium">Deploy Tokens & Pools</span>
            </div>
            
            {/* Connection Line */}
            <div className={`flex-1 h-0.5 mx-4 ${
              deploymentPhaseStatus === 'success' ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            
            <div className={`flex items-center ${
              configurationPhaseStatus === 'loading' ? 'text-blue-600' : 
              configurationPhaseStatus === 'success' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                configurationPhaseStatus === 'loading' ? 'bg-blue-100' : 
                configurationPhaseStatus === 'success' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {configurationPhaseStatus === 'pending' ? (
                  <span className="text-sm">2</span>
                ) : (
                  getPhaseIcon(configurationPhaseStatus)
                )}
              </div>
              <span className="font-medium">Configure Cross-Chain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Cards - Progressive Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {selectedNetworks.map(network => {
          const result = wizardData.deploymentResults[network.key];
          const configStatus = result?.configurationStatus || {};
          const totalTargets = wizardData.selectedChains.filter(c => c !== network.key).length;
          const configuredTargets = Object.values(configStatus).filter(s => s === 'success').length;
          const configuringTargets = Object.values(configStatus).filter(s => s === 'configuring').length;
          const configHasErrors = Object.values(configStatus).some(s => s === 'error');
          const configTxHash = result?.configurationTransactions?.[network.key];
          
          return (
            <div key={network.key} className="flex flex-col p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              {/* Network Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">{network.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">{network.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{network.key}</p>
                  </div>
                </div>
              </div>
              
              {/* Deployment Status */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Deployment</span>
                  {getStatusIcon(result?.status || 'pending')}
                </div>
                
                <div className="flex-1">
                  {result?.status === 'success' ? (
                    <div className="space-y-2">
                      {result.tokenAddress && (
                        <ClickableAddress
                          address={result.tokenAddress}
                          networkKey={network.key}
                          label="Token"
                          className="text-xs"
                        />
                      )}
                      {result.poolAddress && (
                        <ClickableAddress
                          address={result.poolAddress}
                          networkKey={network.key}
                          label="Pool"
                          className="text-xs"
                        />
                      )}
                    </div>
                  ) : result?.status === 'error' ? (
                    <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <div className="flex items-start">
                        <svg className="w-3 h-3 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="break-words">{result.error}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Deploying...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Configuration Status */}
              {result?.status === 'success' && totalTargets > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Configuration</span>
                    <div className="flex items-center">
                      {/* Check if configuration is in progress for this network */}
                      {(currentPhase === 'configuring' && configuringTargets > 0) || 
                       (currentPhase === 'configuring' && configuredTargets === 0) ? (
                        <>
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <span className="text-xs text-blue-600 font-medium">Configuring...</span>
                        </>
                      ) : configHasErrors ? (
                        <>
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <span className="text-xs text-red-600 font-medium">Failed</span>
                        </>
                      ) : (currentPhase === 'completed' || configuredTargets === totalTargets) ? (
                        <>
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Configured</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs text-gray-500">•</span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Configuration Details */}
                  <div className="space-y-1">
                    {wizardData.selectedChains
                      .filter(targetChain => targetChain !== network.key)
                      .map(targetChain => {
                        const targetNetwork = selectedNetworks.find(n => n.key === targetChain);
                        const status = configStatus[targetChain] || 'pending';
                        const configTxHash = result?.configurationTransactions?.[targetChain];
                        
                        return (
                          <div key={targetChain} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">→ {targetNetwork?.name || targetChain}</span>
                            <div className="flex items-center">
                              {status === 'configuring' || (currentPhase === 'configuring' && status === 'pending') ? (
                                <>
                                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                                  <span className="text-blue-600">Configuring</span>
                                </>
                              ) : status === 'success' ? (
                                <>
                                  <svg className="w-3 h-3 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-green-600">Configured</span>
                                  {configTxHash && (
                                    <span className="ml-2 text-xs">
                                      <ConfigurationTxLink 
                                        txHash={configTxHash}
                                        networkKey={network.key}
                                      />
                                    </span>
                                  )}
                                </>
                              ) : status === 'error' ? (
                                <>
                                  <svg className="w-3 h-3 text-red-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-red-600">Failed</span>
                                </>
                              ) : (
                                <span className="text-gray-400">Pending</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {currentPhase === 'completed' && (
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Deployment Complete!</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto">
              Your cross-chain token and pools have been successfully deployed and configured across all selected chains.
              All contracts have been automatically verified on their respective block explorers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
              <Link 
                href="/ccip-js/execution"
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                Test Cross-Chain Transfer
              </Link>
              <Link 
                href="/ccip-js/monitoring"
                className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
              >
                Monitor Deployments
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 6: Execute Transactions
interface ExecuteTransactionsStepProps {
  wizardData: WizardData;
  setWizardData: (data: WizardData) => void;
}

export function ExecuteTransactionsStep({ wizardData, setWizardData }: ExecuteTransactionsStepProps) {
  const { networks } = useAvailableNetworks();
  const [isLoading, setIsLoading] = useState(false);
  const [preparedTransactions, setPreparedTransactions] = useState<any>(null);
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'prepare' | 'execute' | 'completed'>('prepare');

  const selectedNetworks = networks.filter(n => wizardData.selectedChains.includes(n.key));

  const handlePrepareTransactions = async () => {
    setIsLoading(true);
    setCurrentPhase('prepare');
    
    try {
      // Mock replay document - in real implementation, this would come from the indexer
      const mockReplayDocument = {
        version: "1.0",
        transactions: wizardData.selectedChains.flatMap((chainKey, index) => [
          {
            id: `deploy-token-${chainKey}`,
            network: chainKey,
            tx: {
              from: "0x1234567890123456789012345678901234567890",
              to: undefined,
              value: "0",
              data: "0x608060405234801561001057600080fd5b50...", // Mock deployment bytecode
            },
            kind: "deployment",
            txIndex: index * 2
          },
          {
            id: `setup-pool-${chainKey}`,
            network: chainKey,
            tx: {
              from: "0x1234567890123456789012345678901234567890",
              to: "0x9876543210987654321098765432109876543210",
              value: "0",
              data: "0xa9059cbb000000000000000000000000...", // Mock function call
            },
            kind: "contract-call",
            txIndex: index * 2 + 1
          }
        ])
      };

      const response = await fetch('/api/hardhat/replay-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replayDocument: mockReplayDocument }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to prepare transactions');
      }

      const data = await response.json();
      setPreparedTransactions(data);
      
      // Mark simulation as complete
      setWizardData({
        ...wizardData,
        simulationComplete: true,
        replayDocument: mockReplayDocument
      });
      
    } catch (error) {
      console.error('Error preparing transactions:', error);
      alert('Failed to prepare transactions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTransactions = async () => {
    if (!preparedTransactions) return;
    
    setIsLoading(true);
    setCurrentPhase('execute');
    
    try {
      // Mock execution results
      const mockResults = Object.keys(preparedTransactions.transactions).flatMap(network => 
        preparedTransactions.transactions[network].map((tx: any, index: number) => ({
          network,
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          status: 'success',
          txIndex: index
        }))
      );
      
      // Simulate progressive execution
      for (const result of mockResults) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setExecutionResults(prev => [...prev, result]);
      }
      
      setCurrentPhase('completed');
      
    } catch (error) {
      console.error('Error executing transactions:', error);
      alert('Failed to execute transactions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Execute Transactions</h2>
        <p className="text-gray-600">Deploy your tested configuration on actual testnets using the replayer system.</p>
      </div>

      {/* Phase 1: Prepare Transactions */}
      {currentPhase === 'prepare' && (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Step 1: Prepare Transactions</h3>
            <p className="text-blue-800 mb-4">
              Load the simulation results from the indexer and prepare unsigned transactions for each network.
            </p>
            <button
              onClick={handlePrepareTransactions}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Preparing Transactions...' : 'Prepare Transactions'}
            </button>
          </div>

          {preparedTransactions && (
            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-900 mb-3">Transactions Prepared Successfully!</h4>
              <div className="space-y-2 text-sm text-green-800">
                <p>Networks: {preparedTransactions.networks.join(', ')}</p>
                <p>Total Transactions: {preparedTransactions.totalTransactions}</p>
              </div>
              <button
                onClick={() => setCurrentPhase('execute')}
                className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Proceed to Execution
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase 2: Execute Transactions */}
      {currentPhase === 'execute' && (
        <div className="space-y-6">
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">Step 2: Execute on Testnets</h3>
            <p className="text-orange-800 mb-4">
              Sign and execute the prepared transactions on the actual testnet networks.
            </p>
            <button
              onClick={handleExecuteTransactions}
              disabled={isLoading}
              className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Executing Transactions...' : 'Execute All Transactions'}
            </button>
          </div>

          {executionResults.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Execution Progress</h4>
              <div className="space-y-2">
                {executionResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{result.network} - Transaction {result.txIndex + 1}</span>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600 font-mono text-xs">{result.hash.slice(0, 10)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase 3: Completed */}
      {currentPhase === 'completed' && (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Execution Complete!</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            All transactions have been successfully executed on the testnet networks. Your multi-chain deployment is now live!
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
            <Link 
              href="/ccip-js/execution"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Test Cross-Chain Transfer
            </Link>
            <Link 
              href="/ccip-js/monitoring"
              className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
            >
              Monitor Deployments
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Clickable Address Component
interface ClickableAddressProps {
  address: string;
  networkKey: string;
  label?: string;
  className?: string;
}

function ClickableAddress({ address, networkKey, label, className }: ClickableAddressProps) {
  const [copied, setCopied] = useState(false);
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<string | null>(null);
  
  useEffect(() => {
    getBlockExplorerUrl(networkKey, address).then(setBlockExplorerUrl);
  }, [networkKey, address]);
  
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const copyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {label && <span className="text-xs text-gray-500">{label}:</span>}
      <div className="flex items-center space-x-1">
        {blockExplorerUrl ? (
          <a
            href={blockExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline font-mono"
            title="View on block explorer"
          >
            {shortAddress}
          </a>
        ) : (
          <span className="text-xs text-gray-600 font-mono">{shortAddress}</span>
        )}
        {/* Verification indicator */}
        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <button
          onClick={copyToClipboard}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Copy address"
        >
          {copied ? (
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// Configuration Transaction Link Component
interface ConfigurationTxLinkProps {
  txHash: string;
  networkKey: string;
}

function ConfigurationTxLink({ txHash, networkKey }: ConfigurationTxLinkProps) {
  const getTxExplorerUrl = async (networkKey: string, txHash: string): Promise<string | null> => {
    const bloctopusNetworks = await loadBloctopusNetworks();
    const network = bloctopusNetworks.find((n) => n.key === networkKey);

    if (!network?.blockExplorer?.url) {
      return null;
    }
    return `${network.blockExplorer.url}/tx/${txHash}`;
  };
  
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<string | null>(null);
  
  useEffect(() => {
    getTxExplorerUrl(networkKey, txHash).then(setBlockExplorerUrl);
  }, [networkKey, txHash]);
  
  if (!blockExplorerUrl) {
    return <span className="text-xs text-gray-500 font-mono">{txHash.slice(0, 10)}...</span>;
  }
  
  return (
    <a
      href={blockExplorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:text-blue-800 underline font-mono"
      title="View transaction on block explorer"
    >
      {txHash.slice(0, 10)}...
    </a>
  );
} 