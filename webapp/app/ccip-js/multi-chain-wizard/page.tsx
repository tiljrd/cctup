"use client";

import { useState } from "react";
import Link from "next/link";
import { Providers } from "../providers";
import { ConnectWallet } from "@/components/ccip-sections/ConnectWallet";
import { 
  ChainSelectionStep,
  TokenConfigurationStep,
  PoolTypeSelectionStep,
  ReviewAndSimulateStep,
  SimulateExecutionStep,
  ExecutionStep,
  ExecuteTransactionsStep
} from "@/components/ccip-sections/MultiChainWizard";

export interface WizardData {
  selectedChains: string[];
  tokenConfig: {
    name: string;
    symbol: string;
    decimals: string;
    supply: string;
    mint: string;
    recipient: string;
  };
  poolType: 'burnMint' | 'lockRelease';
  liquidity?: string;
  deploymentResults: {
    [chainKey: string]: {
      tokenAddress?: string;
      poolAddress?: string;
      transactionHash?: string;
      status: 'pending' | 'success' | 'error';
      error?: string;
      // Configuration status for each chain pair
      configurationStatus?: {
        [targetChain: string]: 'pending' | 'configuring' | 'success' | 'error';
      };
      // Configuration transaction hashes for each chain pair
      configurationTransactions?: {
        [targetChain: string]: string;
      };
      // Verification status for each contract
      verificationStatus?: {
        token: 'pending' | 'verifying' | 'success' | 'error';
        pool: 'pending' | 'verifying' | 'success' | 'error';
      };
    };
  };
  configurationComplete: boolean;
  deploymentStarted: boolean; // Flag to prevent re-deployment
  verificationStarted: boolean; // Flag to track verification progress
  simulationComplete: boolean;
  replayDocument?: any; // Generated from indexer after simulation
}

const WIZARD_STEPS = [
  { id: 'chains', title: 'Select Chains', description: 'Choose networks for deployment' },
  { id: 'token', title: 'Token Configuration', description: 'Configure token parameters' },
  { id: 'pool', title: 'Pool Type', description: 'Select pool type and options' },
  { id: 'review', title: 'Review & Simulate', description: 'Review and simulate deployment' },
  { id: 'simulate', title: 'Simulate Execution', description: 'Test deployment on fork networks' },
  { id: 'execute', title: 'Execute Transactions', description: 'Deploy on actual testnets' },
];

function MultiChainWizardContent() {
  const [currentStep, setCurrentStep] = useState('chains');
  const [wizardData, setWizardData] = useState<WizardData>({
    selectedChains: [],
    tokenConfig: {
      name: '',
      symbol: '',
      decimals: '18',
      supply: '1000000',
      mint: '',
      recipient: '',
    },
    poolType: 'burnMint',
    deploymentResults: {},
    configurationComplete: false,
    deploymentStarted: false,
    verificationStarted: false,
    simulationComplete: false,
  });

  const getCurrentStepIndex = () => WIZARD_STEPS.findIndex(step => step.id === currentStep);
  const canGoNext = () => {
    switch (currentStep) {
      case 'chains':
        return wizardData.selectedChains.length >= 2;
      case 'token':
        return wizardData.tokenConfig.name && wizardData.tokenConfig.symbol;
      case 'pool':
        return wizardData.poolType;
      case 'review':
        return true;
      case 'simulate':
        return wizardData.configurationComplete;
      case 'execute':
        return wizardData.simulationComplete;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentIndex - 1].id);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'chains':
        return (
          <ChainSelectionStep
            selectedChains={wizardData.selectedChains}
            onChainsChange={(chains) => setWizardData({ ...wizardData, selectedChains: chains })}
          />
        );
      case 'token':
        return (
          <TokenConfigurationStep
            tokenConfig={wizardData.tokenConfig}
            onTokenConfigChange={(config) => setWizardData({ ...wizardData, tokenConfig: config })}
          />
        );
      case 'pool':
        return (
          <PoolTypeSelectionStep
            poolType={wizardData.poolType}
            liquidity={wizardData.liquidity}
            onPoolTypeChange={(type) => setWizardData({ ...wizardData, poolType: type })}
            onLiquidityChange={(liquidity) => setWizardData({ ...wizardData, liquidity })}
          />
        );
      case 'review':
        return (
          <ReviewAndSimulateStep
            wizardData={wizardData}
            onSimulateStart={() => setCurrentStep('simulate')}
            setWizardData={setWizardData}
          />
        );
      case 'simulate':
        return (
          <ExecutionStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        );
      case 'execute':
        return (
          <SimulateExecutionStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-none mx-auto py-4 px-4 sm:py-8 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/ccip-js/deploy" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Deployment
          </Link>
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Multi-Chain Deployment Wizard</h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4">
              Deploy tokens and pools across multiple chains with automatic cross-chain configuration
            </p>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <ConnectWallet />
          </div>
        </div>

        {/* Progress Steps - Progressive Responsive Stepper */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            
            {/* Extra Small - Vertical Stack */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Step Progress</h2>
                <span className="text-sm text-gray-500">
                  {getCurrentStepIndex() + 1} of {WIZARD_STEPS.length}
                </span>
              </div>
              <div className="space-y-3">
                {WIZARD_STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                      getCurrentStepIndex() === index 
                        ? 'bg-blue-600 text-white' 
                        : getCurrentStepIndex() > index 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {getCurrentStepIndex() > index ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className={`text-sm font-medium ${
                        getCurrentStepIndex() >= index ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-xs ${
                        getCurrentStepIndex() >= index ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Small to Medium - Multi-Column Grid */}
            <div className="hidden sm:block md:hidden">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Progress</h2>
                <div className="grid grid-cols-2 gap-4">
                  {WIZARD_STEPS.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs mr-3 ${
                        getCurrentStepIndex() === index 
                          ? 'bg-blue-600 text-white' 
                          : getCurrentStepIndex() > index 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {getCurrentStepIndex() > index ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-medium ${
                          getCurrentStepIndex() >= index ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-xs ${
                          getCurrentStepIndex() >= index ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Medium to Large - Three Column Grid */}
            <div className="hidden md:block lg:hidden">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Step Progress</h2>
                <div className="grid grid-cols-3 gap-4">
                  {WIZARD_STEPS.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs mr-3 ${
                        getCurrentStepIndex() === index 
                          ? 'bg-blue-600 text-white' 
                          : getCurrentStepIndex() > index 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {getCurrentStepIndex() > index ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-medium ${
                          getCurrentStepIndex() >= index ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-xs ${
                          getCurrentStepIndex() >= index ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Large+ - Full Horizontal with Connection Lines */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between">
                {WIZARD_STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex items-center flex-1">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                        getCurrentStepIndex() === index 
                          ? 'bg-blue-600 text-white' 
                          : getCurrentStepIndex() > index 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {getCurrentStepIndex() > index ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <h3 className={`text-sm font-medium truncate ${
                          getCurrentStepIndex() >= index ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-xs truncate ${
                          getCurrentStepIndex() >= index ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={`mx-4 flex-1 h-0.5 ${
                        getCurrentStepIndex() > index ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-6 sm:mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        {currentStep !== 'execute' && (
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 px-4 sm:px-0">
            <button
              onClick={handleBack}
              disabled={getCurrentStepIndex() === 0}
              className="order-2 sm:order-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="order-1 sm:order-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === 'review' ? 'Start Simulation' : currentStep === 'simulate' ? 'Execute Transactions' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MultiChainWizardPage() {
  return (
    <Providers>
      <MultiChainWizardContent />
    </Providers>
  );
} 