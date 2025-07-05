"use client";

import Link from "next/link";
import { Providers } from "../providers";
import { ConnectWallet } from "@/components/ccip-sections/ConnectWallet";
import { 
  DeployToken, 
  SetupBurnMintPool, 
  SetupLockReleasePool, 
  ConfigurePool 
} from "@/components/ccip-sections/TokenDeployment";

function DeploymentContent() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="max-w-7xl mx-auto py-8 px-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Deploy CCIP Tokens & Pools</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deploy BurnMint tokens, setup pools, and configure cross-chain communication directly from the UI.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-8">

          {/* Deployment Components */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Deploy Token */}
            <div className="xl:col-span-2">
              <DeployToken />
            </div>

            {/* Setup Pools */}
            <SetupBurnMintPool />
            <SetupLockReleasePool />

            {/* Configure Pool - Full Width */}
            <div className="xl:col-span-2">
              <ConfigurePool />
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-3">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Deploy Token</h4>
                <p className="text-sm text-gray-600">Create a Burnable ERC677 token with cross-chain capabilities</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-3">
                  <span className="text-green-600 font-semibold">2</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Setup Pool</h4>
                <p className="text-sm text-gray-600">Deploy either BurnMint or LockRelease pool for your token</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mb-3">
                  <span className="text-orange-600 font-semibold">3</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Configure Pool</h4>
                <p className="text-sm text-gray-600">Connect pools across chains for cross-chain transfers</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mb-3">
                  <span className="text-purple-600 font-semibold">4</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Start Bridging</h4>
                <p className="text-sm text-gray-600">Use the configured setup for cross-chain token transfers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeploymentPage() {
  return (
    <Providers>
      <DeploymentContent />
    </Providers>
  );
} 