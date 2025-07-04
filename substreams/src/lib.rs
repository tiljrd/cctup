mod pb;

use substreams::errors::Error;
use substreams_ethereum::pb::eth::v2 as eth;
use pb::cctup::{TxRecord, TxRecords, Raw};

#[substreams::handlers::map]
fn map_transactions(block: eth::Block) -> Result<TxRecords, Error> {
    let mut records = TxRecords::default();

    for transaction in block.transaction_traces.iter() {
        let tx = &transaction.receipt.as_ref().unwrap().transaction;
        
        let kind = classify_transaction(tx, &transaction);
        
        let record = TxRecord {
            id: tx.hash.clone(),
            kind: kind.to_string(),
            raw: Some(Raw {
                from: tx.from.clone(),
                to: tx.to.clone(),
                value: tx.value.clone(),
                gas_limit: tx.gas_limit,
                gas_price: tx.gas_price.clone(),
                max_fee_per_gas: tx.max_fee_per_gas.clone(),
                max_priority_fee_per_gas: tx.max_priority_fee_per_gas.clone(),
                access_list: tx.access_list.clone(),
                data: tx.input.clone(),
                tx_type: tx.r#type as u32,
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

fn classify_transaction(tx: &eth::Transaction, trace: &eth::TransactionTrace) -> TransactionKind {
    if tx.to.is_empty() {
        return TransactionKind::ContractCreation;
    }

    let is_contract_target = trace.calls.len() > 0;
    
    let has_data = !tx.input.is_empty();

    if let Ok(to_bytes) = hex::decode(&tx.to[2..]) {
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
