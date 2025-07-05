"use client";

import { createClient, IERC20ABI } from "@chainlink/ccip-js";
import { 
  Address, 
  encodeAbiParameters, 
  encodeFunctionData, 
  Hex, 
  parseEther, 
  PublicClient, 
  WalletClient 
} from "viem";
import { useState } from "react";

const ccipClient = createClient();

export function GetFee({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [destinationAccount, setDestinationAccount] = useState<string>();
  const [data, setData] = useState<Hex>();
  const [fee, setFee] = useState<string>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get fee</h2>
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
        <label htmlFor="destinationChainSelector">Destination Chain Selector*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationChainSelector"
          placeholder="1234..."
          onChange={({ target }) => setDestinationChainSelector(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="destinationAccount">Destination Account*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationAccount"
          placeholder="0x..."
          onChange={({ target }) => setDestinationAccount(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="message">Message</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="message"
          placeholder="0x..."
          onChange={({ target }) => setData(encodeAbiParameters([{ type: "string", name: "data" }], [target.value]))}
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
          if (routerAddress && destinationChainSelector && amount && destinationAccount && tokenAddress) {
            const result = await ccipClient.getFee({
              client: publicClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
              amount: parseEther(amount),
              destinationAccount: destinationAccount as Address,
              tokenAddress: tokenAddress as Address,
              data,
            });
            setFee(result.toLocaleString());
          }
        }}
      >
        Get fee
      </button>
      {fee && (
        <div className="flex flex-col w-full">
          <label>Fee:</label>
          <code className="w-full whitespace-pre-wrap break-all">{fee}</code>
        </div>
      )}
    </div>
  );
}

export function TransferTokensAndMessage({ walletClient }: { walletClient: WalletClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [destinationAccount, setDestinationAccount] = useState<string>();
  const [data, setData] = useState<Hex>();
  const [messageId, setMessageId] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Transfer Tokens</h2>
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
        <label htmlFor="destinationChainSelector">Destination Chain Selector*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationChainSelector"
          placeholder="1234..."
          onChange={({ target }) => setDestinationChainSelector(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="destinationAccount">Destination Account*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationAccount"
          placeholder="0x..."
          onChange={({ target }) => setDestinationAccount(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="message">Message</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="message"
          placeholder="0x..."
          onChange={({ target }) => setData(encodeAbiParameters([{ type: "string", name: "data" }], [target.value]))}
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
          if (routerAddress && destinationChainSelector && amount && destinationAccount && tokenAddress) {
            const result = await ccipClient.transferTokens({
              client: walletClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
              amount: parseEther(amount),
              destinationAccount: destinationAccount as Address,
              tokenAddress: tokenAddress as Address,
              data,
            });
            setMessageId(result.messageId);
            setTxHash(result.txHash);
          }
        }}
      >
        Transfer
      </button>
      {txHash && (
        <div className="flex flex-col w-full">
          <label>TxHash:</label>
          <code className="w-full whitespace-pre-wrap break-all">{txHash}</code>
        </div>
      )}
      {messageId && (
        <div className="flex flex-col w-full">
          <label>MessageId:</label>
          <code className="w-full whitespace-pre-wrap break-all">{messageId}</code>
        </div>
      )}
    </div>
  );
}

export function SendCCIPMessage({ walletClient }: { walletClient: WalletClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [destinationAccount, setDestinationAccount] = useState<string>();
  const [data, setData] = useState<Hex>();
  const [messageId, setMessageId] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Send Message</h2>
      <div className="flex flex-col">
        <label htmlFor="routerAddress">Router Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="routerAddress"
          placeholder="0x..."
          onChange={({ target }) => setRouterAddress(target.value)}
        />
      </div>

      <div className="flex flex-col w-full">
        <label htmlFor="destinationChainSelector">Destination Chain Selector*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationChainSelector"
          placeholder="1234..."
          onChange={({ target }) => setDestinationChainSelector(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="destinationAccount">Destination Account*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationAccount"
          placeholder="0x..."
          onChange={({ target }) => setDestinationAccount(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="message">Message*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="message"
          placeholder="Message"
          onChange={({ target }) => setData(encodeAbiParameters([{ type: "string", name: "data" }], [target.value]))}
        />
      </div>
      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && destinationChainSelector && destinationAccount && data) {
            const result = await ccipClient.sendCCIPMessage({
              client: walletClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
              destinationAccount: destinationAccount as Address,
              data,
            });
            setMessageId(result.messageId);
            setTxHash(result.txHash);
          }
        }}
      >
        Send Message
      </button>
      {txHash && (
        <div className="flex flex-col w-full">
          <label>TxHash:</label>
          <code className="w-full whitespace-pre-wrap break-all">{txHash}</code>
        </div>
      )}
      {messageId && (
        <div className="flex flex-col w-full">
          <label>MessageId:</label>
          <code className="w-full whitespace-pre-wrap break-all">{messageId}</code>
        </div>
      )}
    </div>
  );
}

export function SendFunctionData({ walletClient }: { walletClient: WalletClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [destinationAccount, setDestinationAccount] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const [messageId, setMessageId] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Send Function Data</h2>
      <p className="italic">Using ERC20 transfer function</p>
      <div className="flex flex-col">
        <label htmlFor="routerAddress">Router Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="routerAddress"
          placeholder="0x..."
          onChange={({ target }) => setRouterAddress(target.value)}
        />
      </div>

      <div className="flex flex-col w-full">
        <label htmlFor="destinationChainSelector">Destination Chain Selector*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationChainSelector"
          placeholder="1234..."
          onChange={({ target }) => setDestinationChainSelector(target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="destinationAccount">Destination Account*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="destinationAccount"
          placeholder="0x..."
          onChange={({ target }) => setDestinationAccount(target.value)}
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
          if (routerAddress && destinationChainSelector && destinationAccount && amount) {
            const result = await ccipClient.sendCCIPMessage({
              client: walletClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
              destinationAccount: destinationAccount as Address,
              data: encodeFunctionData({
                abi: IERC20ABI,
                functionName: "transfer",
                args: [destinationAccount, parseEther(amount)],
              }),
            });
            setMessageId(result.messageId);
            setTxHash(result.txHash);
          }
        }}
      >
        Send Message
      </button>
      {txHash && (
        <div className="flex flex-col w-full">
          <label>TxHash:</label>
          <code className="w-full whitespace-pre-wrap break-all">{txHash}</code>
        </div>
      )}
      {messageId && (
        <div className="flex flex-col w-full">
          <label>MessageId:</label>
          <code className="w-full whitespace-pre-wrap break-all">{messageId}</code>
        </div>
      )}
    </div>
  );
} 