mod pb;

use substreams::errors::Error;
use substreams_ethereum::pb::eth::v2 as eth;
use pb::cctup::{TxRecord, TxRecords, Raw};

#[substreams::handlers::map]
fn map_transactions(block: eth::Block) -> Result<TxRecords, Error> {
    let mut records = TxRecords::default();

    for transaction in block.transaction_traces.iter() {
        if transaction.hash.is_empty() {
            substreams::log::warn!("Skipping transaction with empty hash");
            continue;
        }

        let kind = classify_transaction(&transaction);
        
        let record = TxRecord {
            id: if !transaction.hash.is_empty() {
                transaction.hash.clone()
            } else {
                substreams::log::warn!("Transaction has empty hash, using placeholder");
                vec![0u8; 32] // 32-byte placeholder hash
            },
            kind: kind.to_string(),
            raw: Some(Raw {
                from: if !transaction.from.is_empty() {
                    transaction.from.clone()
                } else {
                    substreams::log::warn!("Transaction {} has empty from address", hex::encode(&transaction.hash));
                    vec![0u8; 20] // 20-byte zero address as fallback
                },
                to: if !transaction.to.is_empty() {
                    transaction.to.clone()
                } else {
                    vec![]
                },
                value: transaction.value.as_ref()
                    .map(|v| {
                        if v.bytes.is_empty() {
                            "0x0".to_string()
                        } else {
                            format!("0x{}", hex::encode(&v.bytes))
                        }
                    })
                    .unwrap_or_else(|| {
                        substreams::log::debug!("Transaction {} missing value, using 0", hex::encode(&transaction.hash));
                        "0x0".to_string()
                    }),
                gas_limit: if transaction.gas_limit > 0 {
                    transaction.gas_limit.to_string()
                } else {
                    substreams::log::warn!("Transaction {} has zero gas_limit", hex::encode(&transaction.hash));
                    "21000".to_string() // Minimum gas for a transaction
                },
                gas_price: transaction.gas_price.as_ref()
                    .map(|v| {
                        if v.bytes.is_empty() {
                            "0x0".to_string()
                        } else {
                            format!("0x{}", hex::encode(&v.bytes))
                        }
                    })
                    .unwrap_or_else(|| {
                        substreams::log::debug!("Transaction {} missing gas_price", hex::encode(&transaction.hash));
                        "0x0".to_string()
                    }),
                max_fee_per_gas: transaction.max_fee_per_gas.as_ref()
                    .map(|v| {
                        if v.bytes.is_empty() {
                            "0x0".to_string()
                        } else {
                            format!("0x{}", hex::encode(&v.bytes))
                        }
                    })
                    .unwrap_or_else(|| {
                        substreams::log::debug!("Transaction {} missing max_fee_per_gas", hex::encode(&transaction.hash));
                        "0x0".to_string()
                    }),
                max_priority_fee_per_gas: transaction.max_priority_fee_per_gas.as_ref()
                    .map(|v| {
                        if v.bytes.is_empty() {
                            "0x0".to_string()
                        } else {
                            format!("0x{}", hex::encode(&v.bytes))
                        }
                    })
                    .unwrap_or_else(|| {
                        substreams::log::debug!("Transaction {} missing max_priority_fee_per_gas", hex::encode(&transaction.hash));
                        "0x0".to_string()
                    }),
                access_list: if !transaction.access_list.is_empty() {
                    format!("0x{}", hex::encode(&transaction.access_list.iter().map(|_| 0u8).collect::<Vec<u8>>()))
                } else {
                    "0x".to_string() // Empty access list
                },
                data: if !transaction.input.is_empty() {
                    transaction.input.clone()
                } else {
                    vec![] // Empty data is valid
                },
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

    if trace.to.len() >= 2 {
        let to_check = if trace.to.starts_with(&[0x30, 0x78]) { // "0x" in bytes
            match std::str::from_utf8(&trace.to[2..]) {
                Ok(hex_str) => {
                    match hex::decode(hex_str) {
                        Ok(bytes) => Some(bytes),
                        Err(_) => {
                            substreams::log::debug!("Failed to decode hex address: {}", hex_str);
                            None
                        }
                    }
                },
                Err(_) => {
                    substreams::log::debug!("Invalid UTF-8 in to address");
                    None
                }
            }
        } else {
            Some(trace.to.clone())
        };

        if let Some(to_bytes) = to_check {
            if to_bytes.len() == 20 {
                if to_bytes[0..19].iter().all(|&b| b == 0) && to_bytes[19] >= 1 && to_bytes[19] <= 9 {
                    return TransactionKind::PrecompileCall;
                }
            }
        }
    }

    match (is_contract_target, has_data) {
        (true, true) => TransactionKind::ContractCallWithData,
        (true, false) => TransactionKind::EthTransferToContract,
        (false, true) => {
            substreams::log::debug!("Transaction {} has data but no contract calls", hex::encode(&trace.hash));
            TransactionKind::ContractCallWithData // Fallback for data to EOA
        },
        (false, false) => TransactionKind::EthTransfer,
    }
}
