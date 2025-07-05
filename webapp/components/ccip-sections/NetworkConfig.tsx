"use client";

import { createClient, RateLimiterState } from "@chainlink/ccip-js";
import { Address, PublicClient } from "viem";
import { useState } from "react";

const ccipClient = createClient();

export function GetOnRampAddress({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [onRamp, setOnRamp] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get On-ramp address:</h2>
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

      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && destinationChainSelector) {
            const result = await ccipClient.getOnRampAddress({
              client: publicClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
            });
            setOnRamp(result);
          }
        }}
      >
        Get On-ramp
      </button>
      {onRamp && (
        <div className="flex flex-col w-full">
          <label>On-ramp contract address:</label>
          <code className="w-full whitespace-pre-wrap break-all">{onRamp}</code>
        </div>
      )}
    </div>
  );
}

export function GetSupportedFeeTokens({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [supportedFeeTokens, setSupportedFeeTokens] = useState<Address[]>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get supported fee tokens:</h2>
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
      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && destinationChainSelector) {
            const supportedFeeTokens = await ccipClient.getSupportedFeeTokens({
              client: publicClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
            });
            setSupportedFeeTokens(supportedFeeTokens);
          }
        }}
      >
        Get supported fee tokens
      </button>
      {supportedFeeTokens && supportedFeeTokens.length > 0 && (
        <div className="flex flex-col w-full">
          <label>Supported fee tokens:</label>
          <code className="w-full whitespace-pre-wrap break-all">
            {supportedFeeTokens.map(address => (
              <pre className="w-full whitespace-pre-wrap break-all" key={address}>
                {address}
              </pre>
            ))}
          </code>
        </div>
      )}
    </div>
  );
}

export function GetLaneRateRefillLimits({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [rateLimits, setRateLimits] = useState<RateLimiterState>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get lane rate refil limits:</h2>
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
      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && destinationChainSelector) {
            const rateLimiterState = await ccipClient.getLaneRateRefillLimits({
              client: publicClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
            });
            setRateLimits(rateLimiterState);
          }
        }}
      >
        Get lane rate refil limits
      </button>
      {rateLimits && (
        <div className="flex flex-col w-full">
          <label>Lane rate limits:</label>
          <code className="w-full whitespace-pre-wrap break-all">
            <pre className="w-full whitespace-pre-wrap break-all">
              {`Tokens: ${rateLimits.tokens.toLocaleString()}`}
            </pre>
            <pre className="w-full whitespace-pre-wrap break-all">
              {`Last updated: ${new Date(rateLimits.lastUpdated * 1000).toLocaleString()}`}
            </pre>
            <pre className="w-full whitespace-pre-wrap break-all">{`Is enabled: ${rateLimits.isEnabled.toString()}`}</pre>
            <pre className="w-full whitespace-pre-wrap break-all">{`Capacity: ${rateLimits.capacity.toLocaleString()}`}</pre>
            <pre className="w-full whitespace-pre-wrap break-all">{`Rate: ${rateLimits.rate.toLocaleString()}`}</pre>
          </code>
        </div>
      )}
    </div>
  );
}

export function IsTokenSupported({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [isTokenSupported, setIsTokenSupported] = useState<string>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Is token supported:</h2>
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
        <label htmlFor="tokenAddress">Token Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="tokenAddress"
          placeholder="0x..."
          onChange={({ target }) => setTokenAddress(target.value)}
        />
      </div>
      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && destinationChainSelector && tokenAddress) {
            const tokenSupported = await ccipClient.isTokenSupported({
              client: publicClient,
              routerAddress: routerAddress as Address,
              tokenAddress: tokenAddress as Address,
              destinationChainSelector,
            });
            setIsTokenSupported(tokenSupported.toString());
          }
        }}
      >
        Is token supported
      </button>
      {isTokenSupported && (
        <div className="flex flex-col w-full">
          <label>Is token supported:</label>
          <code className="w-full whitespace-pre-wrap break-all">{isTokenSupported.toLocaleString()}</code>
        </div>
      )}
    </div>
  );
}

export function GetTokenRateLimitByLane({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [tokenRateLimits, setTokenRateLimits] = useState<RateLimiterState>();

  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Get token rate limit by lane:</h2>
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
        <label htmlFor="tokenAddress">Token Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="tokenAddress"
          placeholder="0x..."
          onChange={({ target }) => setTokenAddress(target.value)}
        />
      </div>
      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && destinationChainSelector && tokenAddress) {
            const tokenRateLimiterState = await ccipClient.getTokenRateLimitByLane({
              client: publicClient,
              routerAddress: routerAddress as Address,
              destinationChainSelector,
              supportedTokenAddress: tokenAddress as Address,
            });
            setTokenRateLimits(tokenRateLimiterState);
          }
        }}
      >
        Get lane rate refil limits
      </button>
      {tokenRateLimits && (
        <>
          <div className="flex flex-col w-full">
            <label>Token lane rate limits:</label>
            <code className="w-full whitespace-pre-wrap break-all">
              <pre className="w-full whitespace-pre-wrap break-all">
                {`Tokens: ${tokenRateLimits.tokens.toLocaleString()}`}
              </pre>
              <pre className="w-full whitespace-pre-wrap break-all">
                {`Last updated: ${new Date(tokenRateLimits.lastUpdated * 1000).toLocaleString()}`}
              </pre>
              <pre className="w-full whitespace-pre-wrap break-all">{`Is enabled: ${tokenRateLimits.isEnabled.toString()}`}</pre>
              <pre className="w-full whitespace-pre-wrap break-all">{`Capacity: ${tokenRateLimits.capacity.toLocaleString()}`}</pre>
              <pre className="w-full whitespace-pre-wrap break-all">{`Rate: ${tokenRateLimits.rate.toLocaleString()}`}</pre>
            </code>
          </div>
        </>
      )}
    </div>
  );
}

export function GetTokenAdminRegistry({ publicClient }: { publicClient: PublicClient }) {
  const [routerAddress, setRouterAddress] = useState<string>();
  const [destinationChainSelector, setDestinationChainSelector] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [tokenAdminRegistry, setTokenAdminRegistry] = useState<string>();
  return (
    <div className="space-y-2 border rounded-md p-4 bg-white">
      <h2 className="font-bold">Token admin registry:</h2>
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
        <label htmlFor="tokenAddress">Token Address*</label>
        <input
          className="border border-slate-300 rounded-md p-1"
          name="tokenAddress"
          placeholder="0x..."
          onChange={({ target }) => setTokenAddress(target.value)}
        />
      </div>
      <button
        className="rounded-md p-2 bg-black text-white hover:bg-slate-600 transition-colors"
        onClick={async () => {
          if (routerAddress && tokenAddress && destinationChainSelector) {
            const tokenAdminRegistryResult = await ccipClient.getTokenAdminRegistry({
              client: publicClient,
              routerAddress: routerAddress as Address,
              tokenAddress: tokenAddress as Address,
              destinationChainSelector,
            });
            setTokenAdminRegistry(tokenAdminRegistryResult);
          }
        }}
      >
        Token admin registry
      </button>
      {tokenAdminRegistry && (
        <div className="flex flex-col w-full">
          <label>Token admin registry address:</label>
          <code className="w-full whitespace-pre-wrap break-all">{tokenAdminRegistry.toLocaleString()}</code>
        </div>
      )}
    </div>
  );
} 