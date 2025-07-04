import Link from "next/link";
import { DefaultWidget } from '@/components/default-widget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Test our CCIP network in all its glory</h1>
          <p className="text-xl text-gray-600 mb-12">
            Discover all connected chains, easily send cross chain messages and tranfers, deploy BnM & LnM tokens and more.
          </p>
        </div>

        {/* Quick Transfer Widget Section */}
        <div className="mb-16">
          
          <div className="flex justify-center">
            <DefaultWidget />
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-16">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-lg font-medium text-gray-500">Or explore advanced functionilities and configurations</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Deploy CCIP Tokens & Pools Section */}
          <Link href="/ccip-js/deploy" className="group">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-indigo-500">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900 group-hover:text-indigo-600">
                  Deploy CCIP Token & Pools
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Deploy BurnMint tokens, setup pools, and configure cross-chain communication.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Deploy BurnMint ERC677 tokens</li>
                <li>• Setup Burn Mint pools</li>
                <li>• Setup Lock Release pools</li>
                <li>• Configure cross-chain pools</li>
              </ul>
            </div>
          </Link>

          {/* Network Configuration Section */}
          <Link href="/ccip-js/network-config" className="group">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                  Network / Token Configuration
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Discover network details, supported tokens, and lane configurations before bridging.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Get On-ramp address</li>
                <li>• Check supported fee tokens</li>
                <li>• View rate limits and token support</li>
                <li>• Inspect token admin settings</li>
              </ul>
            </div>
          </Link>

          {/* Allowance & Approval Section */}
          <Link href="/ccip-js/allowance-approval" className="group">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0l-3-3m3 3l3-3m2-13a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900 group-hover:text-green-600">
                  Allowance & Approval
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Manage token allowances and authorize the router to move your tokens.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Check current allowance</li>
                <li>• Approve token transfers</li>
                <li>• Grant router permissions</li>
              </ul>
            </div>
          </Link>

          {/* Fee Quote & Execution Section */}
          <Link href="/ccip-js/execution" className="group">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-purple-500">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900 group-hover:text-purple-600">
                  Fee Quote & Execution
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Calculate fees and execute cross-chain token transfers and messages.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Get fee estimates</li>
                <li>• Transfer tokens cross-chain</li>
                <li>• Send arbitrary messages</li>
                <li>• Execute function data</li>
              </ul>
            </div>
          </Link>

          {/* Monitoring & Status Section */}
          <Link href="/ccip-js/monitoring" className="group">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-orange-500">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900 group-hover:text-orange-600">
                  Monitoring & Status
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Track transaction progress and monitor cross-chain delivery status.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Get transaction receipts</li>
                <li>• Check transfer status</li>
                <li>• Monitor cross-chain delivery</li>
              </ul>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
