"use client";

import { usePublicClient } from "wagmi";
import Link from "next/link";
import { Providers } from "../providers";
import { ConnectWallet } from "@/components/ccip-sections/ConnectWallet";
import { 
  GetTransactionReceipt,
  GetTransferStatus
} from "@/components/ccip-sections/Monitoring";

function MonitoringContent() {
  const publicClient = usePublicClient();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="max-w-7xl mx-auto py-8 px-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-orange-600 hover:text-orange-800 mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Monitoring & Status</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track what happened on-chain and across chains.
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-orange-300">
                <div className="p-1">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 border-b border-orange-100">
                    <h3 className="font-semibold text-orange-800 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Transaction Receipt
                    </h3>
                  </div>
                  <GetTransactionReceipt publicClient={publicClient} />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-orange-300">
                <div className="p-1">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 border-b border-orange-100">
                    <h3 className="font-semibold text-orange-800 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      Transfer Status
                    </h3>
                  </div>
                  <GetTransferStatus />
                </div>
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
                <p className="text-gray-500 text-lg">Please connect your wallet above to access monitoring tools.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <Providers>
      <MonitoringContent />
    </Providers>
  );
} 