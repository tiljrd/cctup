import { TxRecords } from "../generated/TxStream/TxStream";
import { Transaction } from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleBlock(params: TxRecords): void {
  for (let i = 0; i < params.records.length; i++) {
    const rec = params.records[i];

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
    }

    tx.save();
  }
}
