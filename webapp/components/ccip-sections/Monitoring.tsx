"use client";

import { createClient, TransferStatus } from "@chainlink/ccip-js";
import { useSwitchChain, usePublicClient } from "wagmi";
import { Address, Hash, PublicClient, TransactionReceipt } from "viem";
import { useState } from "react";

const ccipClient = createClient();

export function GetTransactionReceipt({ publicClient }: { publicClient: PublicClient }) {
  const [hash, setHash] = useState<string>();
  const [transactionReceipt, setTransactionReceipt] = useState<TransactionReceipt>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get transaction receipt:</h2>

      <div className="flex flex-col">
        <label htmlFor="messageId">Hash</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="messageId"
          placeholder="0x..."
          onChange={({ target }) => setHash(target.value)}
        />
      </div>

      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (hash) {
            const transactionReceiptResult = await ccipClient.getTransactionReceipt({
              client: publicClient,
              hash: hash as Hash,
            });
            setTransactionReceipt(transactionReceiptResult);
          }
        }}
      >
        Get transaction receipt
      </button>
      {transactionReceipt && (
        <>
          <p>{`Block Number: ${transactionReceipt.blockNumber.toString()}`}</p>
          <p>{`From: ${transactionReceipt.from}`}</p>
          <p>{`To: ${transactionReceipt.to}`}</p>
          <p>{`Status: ${transactionReceipt.status}`}</p>
          <div className="flex flex-col w-full">
            <label>Transaction receipt:</label>
            <code className="w-full whitespace-pre-wrap break-all">
              <pre className="w-full whitespace-pre-wrap break-all">
                {`Block Number: ${transactionReceipt.blockNumber.toString()}`}
              </pre>
              <pre className="w-full whitespace-pre-wrap break-all">{`From: ${transactionReceipt.from}`}</pre>
              <pre className="w-full whitespace-pre-wrap break-all">{`To: ${transactionReceipt.to}`}</pre>
              <pre className="w-full whitespace-pre-wrap break-all">{`Status: ${transactionReceipt.status}`}</pre>
            </code>
          </div>
        </>
      )}
    </div>
  );
}

export function GetTransferStatus() {
  const { chains } = useSwitchChain();
  const [destinationRouterAddress, setDestinationRouterAddress] = useState<string>();
  const [destinationChainId, setDestinationChainId] = useState<number>();
  const [sourceChainSelector, setSourceChainSelector] = useState<string>();
  const [messageId, setMessageId] = useState<string>();
  const [transferStatus, setTransferStatus] = useState<TransferStatus | null>();

  const destinationChainPublicClient = usePublicClient({
    chainId: destinationChainId,
  });

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get transfer status:</h2>
      <div className="space-y-2">
        <div className="flex flex-col">
          <label htmlFor="destinationRouterAddress">Destination router address</label>
          <input
            className="border border-slate-300 rounded-md p-1"
            name="destinationRouterAddress"
            placeholder="0x..."
            onChange={({ target }) => setDestinationRouterAddress(target.value)}
          />
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="destinationChainId">Destination chain id</label>
          <select
            className="border border-slate-300 rounded-md p-1"
            onChange={e => setDestinationChainId(Number(e.target.value))}
          >
            {chains.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="sourceChainSelector">Source chain selector</label>
          <input
            className="border border-slate-300 rounded-md p-1"
            name="sourceChainSelector"
            placeholder="1234..."
            onChange={({ target }) => setSourceChainSelector(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="messageId">Message ID</label>
          <input
            className="border border-slate-300 rounded-md p-1"
            name="messageId"
            placeholder="0x..."
            onChange={({ target }) => setMessageId(target.value)}
          />
        </div>
      </div>
      <div className="space-x-2">
        <button
          className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
          onClick={async () => {
            if (destinationChainPublicClient && destinationRouterAddress && sourceChainSelector && messageId) {
              const transferStatusResult = await ccipClient.getTransferStatus({
                client: destinationChainPublicClient,
                destinationRouterAddress: destinationRouterAddress as Address,
                sourceChainSelector,
                messageId: messageId as Hash,
              });
              setTransferStatus(transferStatusResult);
            }
          }}
        >
          Get transfer status
        </button>
        {transferStatus && <p>{transferStatus}</p>}
      </div>
    </div>
  );
} 