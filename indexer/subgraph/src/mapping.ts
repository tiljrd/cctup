import { TxRecords } from "./types/TxStream";
import { Transaction } from "../generated_sepolia/schema";
import { Bytes, BigInt, log } from "@graphprotocol/graph-ts";

class DecodedData {
  fnSig: string;
  args: string;
  abiSource: string;

  constructor(fnSig: string, args: string, abiSource: string) {
    this.fnSig = fnSig;
    this.args = args;
    this.abiSource = abiSource;
  }
}

function tryDecodeTransactionData(data: Bytes, to: Bytes): DecodedData | null {
  if (!data || data.length < 4) {
    return null;
  }

  const selector = data.toHexString().slice(0, 10);
  
  const knownSelectors = getKnownSelectors();
  const signature = knownSelectors.get(selector);
  
  if (signature) {
    log.info("Decoded transaction with selector {} to signature {}", [selector, signature]);
    return new DecodedData(
      signature,
      "[]", 
      "builtin"
    );
  }

  return null;
}

function getKnownSelectors(): Map<string, string> {
  const selectors = new Map<string, string>();
  
  selectors.set("0xa9059cbb", "transfer(address,uint256)");
  selectors.set("0x23b872dd", "transferFrom(address,address,uint256)");
  selectors.set("0x095ea7b3", "approve(address,uint256)");
  selectors.set("0x70a08231", "balanceOf(address)");
  selectors.set("0xdd62ed3e", "allowance(address,address)");
  selectors.set("0x18160ddd", "totalSupply()");
  selectors.set("0x06fdde03", "name()");
  selectors.set("0x95d89b41", "symbol()");
  selectors.set("0x313ce567", "decimals()");
  selectors.set("0x40c10f19", "mint(address,uint256)");
  selectors.set("0x42966c68", "burn(uint256)");
  selectors.set("0x79cc6790", "burnFrom(address,uint256)");
  selectors.set("0x8da5cb5b", "owner()");
  selectors.set("0xf2fde38b", "transferOwnership(address)");
  selectors.set("0x715018a6", "renounceOwnership()");
  selectors.set("0x5c975abb", "paused()");
  selectors.set("0x8456cb59", "pause()");
  selectors.set("0x3f4ba83a", "unpause()");
  
  return selectors;
}

export function handleBlock(params: TxRecords): void {
  for (let i = 0; i < params.records.length; i++) {
    const rec = params.records[i];
    if (!rec) {
      continue;
    }

    if (!rec.raw) {
      continue;
    }

    let tx = new Transaction(rec.id);
    tx.kind = rec.kind.toString();
    tx.from = rec.raw!.from as Bytes;
    tx.to = rec.raw!.to as Bytes | null;
    tx.value = BigInt.fromString(rec.raw!.value);
    tx.gasLimit = BigInt.fromString(rec.raw!.gas_limit);
    tx.gasPrice = rec.raw!.gas_price ? BigInt.fromString(rec.raw!.gas_price) : null;
    tx.maxFeePerGas = rec.raw!.max_fee_per_gas ? BigInt.fromString(rec.raw!.max_fee_per_gas) : null;
    tx.maxPriorityFeePerGas = rec.raw!.max_priority_fee_per_gas
      ? BigInt.fromString(rec.raw!.max_priority_fee_per_gas)
      : null;
    tx.accessList = rec.raw!.access_list;
    tx.data = rec.raw!.data;

    if (rec.decoded) {
      tx.fnSig = rec.decoded!.fn_sig;
      tx.args = rec.decoded!.args_json;
      tx.abiSource = rec.decoded!.abi_source;
    } else if (rec.raw!.data && rec.raw!.data.length > 2) {
      const decodedData = tryDecodeTransactionData(rec.raw!.data, rec.raw!.to);
      if (decodedData) {
        tx.fnSig = decodedData.fnSig;
        tx.args = decodedData.args;
        tx.abiSource = decodedData.abiSource;
      }
    }

    tx.save();
  }
}
