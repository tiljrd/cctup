"use client";

import { usePublicClient, useWalletClient } from "wagmi";
import Link from "next/link";
import { Providers } from "../providers";
import { ConnectWallet } from "@/components/ccip-sections/ConnectWallet";
import { GetAllowance, ApproveRouter } from "@/components/ccip-sections/AllowanceApproval";

function AllowanceApprovalContent() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto py-8 px-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-green-600 hover:text-green-800 mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0l-3-3m3 3l3-3m2-13a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Allowance & Approval</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Make sure the router is authorized to move the user&apos;s tokens.
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Read Functions */}
              {publicClient && (
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-green-300">
                  <div className="p-1">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 border-b border-green-100">
                      <h3 className="font-semibold text-green-800 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Read Operations
                      </h3>
                    </div>
                    <GetAllowance publicClient={publicClient} />
                  </div>
                </div>
              )}

              {/* Write Functions */}
              {walletClient && (
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden hover:border-green-300">
                  <div className="p-1">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 border-b border-green-100">
                      <h3 className="font-semibold text-green-800 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Write Operations
                      </h3>
                    </div>
                    <ApproveRouter walletClient={walletClient} />
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
                <p className="text-gray-500 text-lg">Please connect your wallet above to access allowance and approval functions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllowanceApprovalPage() {
  return (
    <Providers>
      <AllowanceApprovalContent />
    </Providers>
  );
} 