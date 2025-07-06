import { TxRecords } from "./types/TxStream";
import { Transaction } from "../generated/schema";
import { Bytes, BigInt, log } from "@graphprotocol/graph-ts";

function safeParseBigInt(value: string, defaultValue: BigInt): BigInt {
  if (value.length == 0) {
    return defaultValue;
  }
  if (!value.startsWith("0x") || value.length <= 2) {
    log.warning("Invalid hex format for BigInt: {}", [value]);
    return defaultValue;
  }
  return BigInt.fromString(value);
}

function safeParseOptionalBigInt(value: string): BigInt | null {
  if (value.length == 0) {
    return null;
  }
  if (!value.startsWith("0x") || value.length <= 2) {
    log.warning("Invalid hex format for optional BigInt: {}", [value]);
    return null;
  }
  return BigInt.fromString(value);
}

function getKnownSelector(selector: string): string {
  if (selector == "0xa9059cbb") return "transfer(address,uint256)";
  if (selector == "0x23b872dd") return "transferFrom(address,address,uint256)";
  if (selector == "0x095ea7b3") return "approve(address,uint256)";
  if (selector == "0x70a08231") return "balanceOf(address)";
  if (selector == "0xdd62ed3e") return "allowance(address,address)";
  if (selector == "0x18160ddd") return "totalSupply()";
  if (selector == "0x06fdde03") return "name()";
  if (selector == "0x95d89b41") return "symbol()";
  if (selector == "0x313ce567") return "decimals()";
  if (selector == "0x40c10f19") return "mint(address,uint256)";
  if (selector == "0x42966c68") return "burn(uint256)";
  if (selector == "0x79cc6790") return "burnFrom(address,uint256)";
  if (selector == "0x8da5cb5b") return "owner()";
  if (selector == "0xf2fde38b") return "transferOwnership(address)";
  if (selector == "0x715018a6") return "renounceOwnership()";
  if (selector == "0x5c975abb") return "paused()";
  if (selector == "0x8456cb59") return "pause()";
  if (selector == "0x3f4ba83a") return "unpause()";
  return "";
}

export function handleBlock(params: TxRecords): void {
  if (!params.records) {
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
      if (rec.id) {
        log.warning("Skipping record {} with missing raw data", [rec.id.toHexString()]);
      } else {
        log.warning("Skipping record with missing raw data and id", []);
      }
      continue;
    }

    if (!rec.id) {
      log.warning("Skipping record with missing id", []);
      continue;
    }

    let tx = new Transaction(rec.id);
    
    if (rec.kind) {
      tx.kind = rec.kind.toString();
    } else {
      tx.kind = "unknown";
    }
    
    if (!rec.raw.from) {
      log.warning("Transaction {} missing from address, skipping", [rec.id.toHexString()]);
      continue;
    }
    tx.from = rec.raw.from as Bytes;
    
    if (rec.raw.to) {
      tx.to = rec.raw.to as Bytes;
    } else {
      tx.to = null;
    }
    
    if (rec.raw.value) {
      tx.value = safeParseBigInt(rec.raw.value, BigInt.fromI32(0));
    } else {
      tx.value = BigInt.fromI32(0);
    }
    
    if (rec.raw.gas_limit) {
      tx.gasLimit = safeParseBigInt(rec.raw.gas_limit, BigInt.fromI32(21000));
    } else {
      tx.gasLimit = BigInt.fromI32(21000);
    }
    
    if (rec.raw.gas_price) {
      tx.gasPrice = safeParseOptionalBigInt(rec.raw.gas_price);
    } else {
      tx.gasPrice = null;
    }
    
    if (rec.raw.max_fee_per_gas) {
      tx.maxFeePerGas = safeParseOptionalBigInt(rec.raw.max_fee_per_gas);
    } else {
      tx.maxFeePerGas = null;
    }
    
    if (rec.raw.max_priority_fee_per_gas) {
      tx.maxPriorityFeePerGas = safeParseOptionalBigInt(rec.raw.max_priority_fee_per_gas);
    } else {
      tx.maxPriorityFeePerGas = null;
    }
    
    if (rec.raw.access_list) {
      tx.accessList = rec.raw.access_list;
    } else {
      tx.accessList = Bytes.empty();
    }
    
    if (rec.raw.data) {
      tx.data = rec.raw.data;
    } else {
      tx.data = Bytes.empty();
    }

    if (rec.decoded && rec.decoded.fn_sig && rec.decoded.args_json && rec.decoded.abi_source) {
      tx.fnSig = rec.decoded.fn_sig;
      tx.args = rec.decoded.args_json;
      tx.abiSource = rec.decoded.abi_source;
    } else if (rec.raw.data && rec.raw.data.length > 2 && rec.raw.to) {
      const hexString = rec.raw.data.toHexString();
      if (hexString.length >= 10) {
        const selector = hexString.slice(0, 10);
        const signature = getKnownSelector(selector);
        if (signature.length > 0) {
          tx.fnSig = signature;
          tx.args = "[]";
          tx.abiSource = "builtin";
          log.info("Decoded transaction with selector {} to signature {}", [selector, signature]);
        }
      }
    }

    tx.save();
  }
}
