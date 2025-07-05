"use client";

import { usePublicClient, useWalletClient } from "wagmi";
import Link from "next/link";
import { Providers } from "../providers";
import { ConnectWallet } from "@/components/ccip-sections/ConnectWallet";
import { 
  GetFee,
  TransferTokensAndMessage,
  SendCCIPMessage,
  SendFunctionData
} from "@/components/ccip-sections/Execution";

function ExecutionContent() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="max-w-7xl mx-auto py-8 px-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Fee Quote & Execution</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Calculate cost, then perform the actual token or data transfer.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-8">
          {/* Wallet Connection - Full Width */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <ConnectWallet />
          </div>

          {(publicClient || walletClient) ? (
            <div className="space-y-8">
              {/* Fee Calculation Section */}
              {publicClient && (
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-purple-300">
                  <div className="p-1">
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 border-b border-purple-100">
                      <h3 className="font-semibold text-purple-800 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Fee Calculation
                      </h3>
                    </div>
                    <GetFee publicClient={publicClient} />
                  </div>
                </div>
              )}

              {/* Execution Functions */}
              {walletClient && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-purple-300">
                    <div className="p-1">
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 border-b border-purple-100">
                        <h3 className="font-semibold text-purple-800 flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Token Transfer
                        </h3>
                      </div>
                      <TransferTokensAndMessage walletClient={walletClient} />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-purple-300">
                    <div className="p-1">
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 border-b border-purple-100">
                        <h3 className="font-semibold text-purple-800 flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Send Message
                        </h3>
                      </div>
                      <SendCCIPMessage walletClient={walletClient} />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-purple-300 lg:col-span-2 xl:col-span-1">
                    <div className="p-1">
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 border-b border-purple-100">
                        <h3 className="font-semibold text-purple-800 flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          Function Data
                        </h3>
                      </div>
                      <SendFunctionData walletClient={walletClient} />
                    </div>
                  </div>
                </div>
              )}
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
                <p className="text-gray-500 text-lg">Please connect your wallet above to access fee calculations and execution operations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExecutionPage() {
  return (
    <Providers>
      <ExecutionContent />
    </Providers>
  );
} 