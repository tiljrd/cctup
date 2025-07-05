import { BigInt, Bytes } from "@graphprotocol/graph-ts";

export class TxRecord {
    id: Bytes;
    kind: string;
    raw: Raw | null;
    decoded: Decoded | null;

    constructor(id: Bytes, kind: string, raw: Raw | null, decoded: Decoded | null) {
        this.id = id;
        this.kind = kind;
        this.raw = raw;
        this.decoded = decoded;
    }
}

export class Raw {
    from: Bytes;
    to: Bytes;
    value: string;
    gas_limit: string;
    gas_price: string;
    max_fee_per_gas: string;
    max_priority_fee_per_gas: string;
    access_list: Bytes;
    data: Bytes;
    tx_type: string;

    constructor(
        from: Bytes,
        to: Bytes,
        value: string,
        gas_limit: string,
        gas_price: string,
        max_fee_per_gas: string,
        max_priority_fee_per_gas: string,
        access_list: Bytes,
        data: Bytes,
        tx_type: string
    ) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.gas_limit = gas_limit;
        this.gas_price = gas_price;
        this.max_fee_per_gas = max_fee_per_gas;
        this.max_priority_fee_per_gas = max_priority_fee_per_gas;
        this.access_list = access_list;
        this.data = data;
        this.tx_type = tx_type;
    }
}

export class Decoded {
    selector: string;
    fn_sig: string;
    args: Array<string>;
    abi_source: string;
    args_json: string;

    constructor(
        selector: string,
        fn_sig: string,
        args: Array<string>,
        abi_source: string,
        args_json: string
    ) {
        this.selector = selector;
        this.fn_sig = fn_sig;
        this.args = args;
        this.abi_source = abi_source;
        this.args_json = args_json;
    }
}

export class TxRecords {
    records: Array<TxRecord>;

    constructor(records: Array<TxRecord>) {
        this.records = records;
    }
}