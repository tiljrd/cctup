"use client";

import { useConnect, useAccount, useSwitchChain } from "wagmi";
import { useState } from "react";

export function ConnectWallet() {
  const { chain, address } = useAccount();
  const { connectors, connect, isError: isConnectError, error: connectError } = useConnect();
  const { chains, switchChain, error: switchError, isError: isSwitchError } = useSwitchChain();

  const [chainId, setChainId] = useState<string>(`${chain?.id}`);

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Connect Wallet:</h2>
      <div className="space-x-2">
        {connectors.map(connector => (
          <button
            className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
            key={connector.uid}
            onClick={() => connect({ connector })}
          >
            {connector.name}
          </button>
        ))}
      </div>
      {isConnectError && <p className="text-red-500">{connectError.message}</p>}
      {address && <p>{`Address: ${address}`}</p>}
      {chain && (
        <>
          <p>{`Connected to ${chain.name} (chainId: ${chain.id})`}</p>
          <div className="flex flex-col">
            <label htmlFor="chainId">Switch to chain</label>
            <select
              className="border border-slate-300 rounded-md p-1"
              name="chainId"
              value={chainId}
              onChange={e => setChainId(e.target.value)}
            >
              {chains.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
            onClick={() => switchChain({ chainId: Number(chainId) })}
          >
            Switch
          </button>
          {isSwitchError && <p className="text-red-500">{switchError.message}</p>}
        </>
      )}
    </div>
  );
} 