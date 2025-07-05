#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TxRecords {
    #[prost(message, repeated, tag = "1")]
    pub records: ::prost::alloc::vec::Vec<TxRecord>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TxRecord {
    #[prost(bytes = "vec", tag = "1")]
    pub id: ::prost::alloc::vec::Vec<u8>,
    #[prost(string, tag = "2")]
    pub kind: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "3")]
    pub raw: ::core::option::Option<Raw>,
    #[prost(message, optional, tag = "4")]
    pub decoded: ::core::option::Option<Decoded>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Raw {
    #[prost(bytes = "vec", tag = "1")]
    pub from: ::prost::alloc::vec::Vec<u8>,
    #[prost(bytes = "vec", tag = "2")]
    pub to: ::prost::alloc::vec::Vec<u8>,
    #[prost(string, tag = "3")]
    pub value: ::prost::alloc::string::String,
    #[prost(uint64, tag = "4")]
    pub gas_limit: u64,
    #[prost(string, tag = "5")]
    pub gas_price: ::prost::alloc::string::String,
    #[prost(string, tag = "6")]
    pub max_fee_per_gas: ::prost::alloc::string::String,
    #[prost(string, tag = "7")]
    pub max_priority_fee_per_gas: ::prost::alloc::string::String,
    #[prost(string, tag = "8")]
    pub access_list: ::prost::alloc::string::String,
    #[prost(bytes = "vec", tag = "9")]
    pub data: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint32, tag = "10")]
    pub tx_type: u32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Decoded {
    #[prost(string, tag = "1")]
    pub selector: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub fn_sig: ::prost::alloc::string::String,
    #[prost(string, repeated, tag = "3")]
    pub args: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    #[prost(string, tag = "4")]
    pub abi_source: ::prost::alloc::string::String,
    #[prost(string, tag = "5")]
    pub args_json: ::prost::alloc::string::String,
}
