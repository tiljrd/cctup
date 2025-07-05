"use client";

import { createClient } from "@chainlink/ccip-js";
import { usePublicClient } from "wagmi";
import Link from "next/link";
import { Providers } from "../providers";
import { ConnectWallet } from "@/components/ccip-sections/ConnectWallet";
import { 
  GetOnRampAddress,
  GetSupportedFeeTokens,
  GetLaneRateRefillLimits,
  IsTokenSupported,
  GetTokenRateLimitByLane,
  GetTokenAdminRegistry
} from "@/components/ccip-sections/NetworkConfig";

const ccipClient = createClient();

function NetworkConfigContent() {
  const publicClient = usePublicClient();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Network / Token Configuration</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Use these read-only calls first to discover whether a token or lane is usable and what limits apply.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-8">
          {/* Wallet Connection - Full Width */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <ConnectWallet />
          </div>

          {publicClient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-blue-300">
                <GetOnRampAddress publicClient={publicClient} />
              </div>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-blue-300">
                <GetSupportedFeeTokens publicClient={publicClient} />
              </div>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-blue-300">
                <GetLaneRateRefillLimits publicClient={publicClient} />
              </div>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-blue-300">
                <IsTokenSupported publicClient={publicClient} />
              </div>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-blue-300">
                <GetTokenRateLimitByLane publicClient={publicClient} />
              </div>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-blue-300">
                <GetTokenAdminRegistry publicClient={publicClient} />
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0l-3-3m3 3l3-3M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-500 text-lg">Please connect your wallet above to access network configuration tools.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NetworkConfigPage() {
  return (
    <Providers>
      <NetworkConfigContent />
    </Providers>
  );
} 