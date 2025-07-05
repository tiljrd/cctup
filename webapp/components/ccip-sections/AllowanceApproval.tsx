"use client";

import { createClient } from "@chainlink/ccip-js";
import { Address, parseEther, PublicClient, WalletClient } from "viem";
import { useState } from "react";

const ccipClient = createClient();

export function GetAllowance({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [account, setAccount] = useState<string>();
  const [allowance, setAllowance] = useState<string>();
  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get allowance:</h2>
      <div className="flex flex-col">
        <label htmlFor="routerAddress">Router Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="routerAddress"
          placeholder="0x..."
          onChange={({ target }) => setRouterAddress(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="tokenAddress">Token Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="tokenAddress"
          placeholder="0x..."
          onChange={({ target }) => setTokenAddress(target.value)}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="account">Account address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="account"
          placeholder="0x..."
          onChange={({ target }) => setAccount(target.value)}
        />
      </div>

      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (account && routerAddress && tokenAddress) {
            const result = await ccipClient.getAllowance({
              client: publicClient,
              routerAddress: routerAddress as Address,
              tokenAddress: tokenAddress as Address,
              account: account as Address,
            });
            setAllowance(result.toLocaleString());
          }
        }}
      >
        Get allowance
      </button>
      {allowance && (
        <div className="flex flex-col w-full">
          <label>Allowance:</label>
          <code className="w-full whitespace-pre-wrap break-all">{allowance}</code>
        </div>
      )}
    </div>
  );
}

export function ApproveRouter({ walletClient }: { walletClient: WalletClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Approve Transfer</h2>
      <div className="flex flex-col">
        <label htmlFor="routerAddress">Router Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="routerAddress"
          placeholder="0x..."
          onChange={({ target }) => setRouterAddress(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="tokenAddress">Token Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="tokenAddress"
          placeholder="0x..."
          onChange={({ target }) => setTokenAddress(target.value)}
        />
      </div>
      <div className="flex flex-col w-full">
        <label htmlFor="amount">Amount*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="amount"
          type="number"
          step={10 / 10 ** 6}
          min={0}
          placeholder="0.1"
          onChange={({ target }) => setAmount(target.value)}
        />
      </div>
      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && amount && tokenAddress) {
            const result = await ccipClient.approveRouter({
              client: walletClient,
              routerAddress: routerAddress as Address,
              amount: parseEther(amount),
              tokenAddress: tokenAddress as Address,
            });
            setTxHash(result.txHash);
          }
        }}
      >
        Approve
      </button>
      {txHash && (
        <div className="flex flex-col w-full">
          <label>TxHash:</label>
          <code className="w-full whitespace-pre-wrap break-all">{txHash}</code>
        </div>
      )}
    </div>
  );
} 