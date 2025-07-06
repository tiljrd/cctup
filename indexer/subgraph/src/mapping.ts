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

  try {
    const hexString = data.toHexString();
    if (!hexString || hexString.length < 10) {
      log.warning("Invalid hex string from transaction data: {}", [hexString || "null"]);
      return null;
    }
    
    const selector = hexString.slice(0, 10);
    
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
  } catch (error) {
    log.warning("Error decoding transaction data: {}", [error.toString()]);
    return null;
  }
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
  if (!params || !params.records) {
    log.warning("handleBlock called with null or missing records", []);
    return;
  }

  for (let i = 0; i < params.records.length; i++) {
    const rec = params.records[i];
    if (!rec) {
      log.warning("Skipping null record at index {}", [i.toString()]);
      continue;
    }

    if (!rec.raw) {
      log.warning("Skipping record {} with missing raw data", [rec.id ? rec.id.toHexString() : "unknown"]);
      continue;
    }

    if (!rec.id) {
      log.warning("Skipping record with missing id", []);
      continue;
    }

    try {
      let tx = new Transaction(rec.id);
      
      tx.kind = rec.kind ? rec.kind.toString() : "unknown";
      
      if (!rec.raw.from) {
        log.warning("Transaction {} missing from address, skipping", [rec.id.toHexString()]);
        continue;
      }
      tx.from = rec.raw.from as Bytes;
      
      tx.to = rec.raw.to ? (rec.raw.to as Bytes) : null;
      
      try {
        tx.value = rec.raw.value ? BigInt.fromString(rec.raw.value) : BigInt.fromI32(0);
      } catch (error) {
        log.warning("Failed to parse value for transaction {}: {}, using 0", [rec.id.toHexString(), rec.raw.value || "null"]);
        tx.value = BigInt.fromI32(0);
      }
      
      try {
        tx.gasLimit = rec.raw.gas_limit ? BigInt.fromString(rec.raw.gas_limit) : BigInt.fromI32(0);
      } catch (error) {
        log.warning("Failed to parse gas_limit for transaction {}: {}, using 0", [rec.id.toHexString(), rec.raw.gas_limit || "null"]);
        tx.gasLimit = BigInt.fromI32(0);
      }
      
      if (rec.raw.gas_price) {
        try {
          tx.gasPrice = BigInt.fromString(rec.raw.gas_price);
        } catch (error) {
          log.warning("Failed to parse gas_price for transaction {}: {}, using null", [rec.id.toHexString(), rec.raw.gas_price]);
          tx.gasPrice = null;
        }
      } else {
        tx.gasPrice = null;
      }
      
      if (rec.raw.max_fee_per_gas) {
        try {
          tx.maxFeePerGas = BigInt.fromString(rec.raw.max_fee_per_gas);
        } catch (error) {
          log.warning("Failed to parse max_fee_per_gas for transaction {}: {}, using null", [rec.id.toHexString(), rec.raw.max_fee_per_gas]);
          tx.maxFeePerGas = null;
        }
      } else {
        tx.maxFeePerGas = null;
      }
      
      if (rec.raw.max_priority_fee_per_gas) {
        try {
          tx.maxPriorityFeePerGas = BigInt.fromString(rec.raw.max_priority_fee_per_gas);
        } catch (error) {
          log.warning("Failed to parse max_priority_fee_per_gas for transaction {}: {}, using null", [rec.id.toHexString(), rec.raw.max_priority_fee_per_gas]);
          tx.maxPriorityFeePerGas = null;
        }
      } else {
        tx.maxPriorityFeePerGas = null;
      }
      
      tx.accessList = rec.raw.access_list || "";
      tx.data = rec.raw.data || Bytes.empty();

      if (rec.decoded && rec.decoded.fn_sig && rec.decoded.args_json && rec.decoded.abi_source) {
        tx.fnSig = rec.decoded.fn_sig;
        tx.args = rec.decoded.args_json;
        tx.abiSource = rec.decoded.abi_source;
      } else if (rec.raw.data && rec.raw.data.length > 2 && rec.raw.to) {
        const decodedData = tryDecodeTransactionData(rec.raw.data, rec.raw.to);
        if (decodedData) {
          tx.fnSig = decodedData.fnSig;
          tx.args = decodedData.args;
          tx.abiSource = decodedData.abiSource;
        }
      }

      tx.save();
      
    } catch (error) {
      log.error("Failed to process transaction {}: {}", [rec.id.toHexString(), error.toString()]);
      continue;
    }
  }
}
