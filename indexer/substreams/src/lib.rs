mod pb;

use substreams::errors::Error;
use substreams_ethereum::pb::eth::v2 as eth;
use pb::cctup::{TxRecord, TxRecords, Raw};

#[substreams::handlers::map]
fn map_transactions(block: eth::Block) -> Result<TxRecords, Error> {
    let mut records = TxRecords::default();

    for transaction in block.transaction_traces.iter() {
        let kind = classify_transaction(&transaction);
        
        let record = TxRecord {
            id: transaction.hash.clone(),
            kind: kind.to_string(),
            raw: Some(Raw {
                from: transaction.from.clone(),
                to: transaction.to.clone(),
                value: transaction.value.as_ref().map(|v| format!("0x{}", hex::encode(&v.bytes))).unwrap_or_default(),
                gas_limit: transaction.gas_limit,
                gas_price: transaction.gas_price.as_ref().map(|v| format!("0x{}", hex::encode(&v.bytes))).unwrap_or_default(),
                max_fee_per_gas: transaction.max_fee_per_gas.as_ref().map(|v| format!("0x{}", hex::encode(&v.bytes))).unwrap_or_default(),
                max_priority_fee_per_gas: transaction.max_priority_fee_per_gas.as_ref().map(|v| format!("0x{}", hex::encode(&v.bytes))).unwrap_or_default(),
                access_list: format!("0x{}", hex::encode(&transaction.access_list.iter().map(|_| 0u8).collect::<Vec<u8>>())),
                data: transaction.input.clone(),
                tx_type: transaction.r#type as u32,
            }),
            decoded: None, // Will be populated by ABI fetcher later
        };

        records.records.push(record);
    }

    Ok(records)
}

#[derive(Debug)]
enum TransactionKind {
    ContractCreation,
    EthTransfer,
    EthTransferToContract,
    ContractCallWithData,
    ContractCallNoData,
    PrecompileCall,
}

impl ToString for TransactionKind {
    fn to_string(&self) -> String {
        match self {
            TransactionKind::ContractCreation => "contractCreation".to_string(),
            TransactionKind::EthTransfer => "ethTransfer".to_string(),
            TransactionKind::EthTransferToContract => "ethTransferToContract".to_string(),
            TransactionKind::ContractCallWithData => "contractCallWithData".to_string(),
            TransactionKind::ContractCallNoData => "contractCallNoData".to_string(),
            TransactionKind::PrecompileCall => "precompileCall".to_string(),
        }
    }
}

fn classify_transaction(trace: &eth::TransactionTrace) -> TransactionKind {
    if trace.to.is_empty() {
        return TransactionKind::ContractCreation;
    }

    let is_contract_target = trace.calls.len() > 0;
    
    let has_data = !trace.input.is_empty();

    if let Ok(to_bytes) = hex::decode(&trace.to[2..]) {
        if to_bytes.len() == 20 && to_bytes[0..19].iter().all(|&b| b == 0) && to_bytes[19] <= 9 && to_bytes[19] >= 1 {
            return TransactionKind::PrecompileCall;
        }
    }

    match (is_contract_target, has_data) {
        (true, true) => TransactionKind::ContractCallWithData,
        (true, false) => TransactionKind::EthTransferToContract,
        (false, true) => TransactionKind::ContractCallWithData, // Fallback for data to EOA
        (false, false) => TransactionKind::EthTransfer,
    }
}
