import fs from "fs";
import axios from "axios";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const key = process.env.ETHERSCAN_KEY;
if (!key) {
  throw new Error("ETHERSCAN_KEY environment variable is required");
}

interface Transaction {
  id: string;
  kind: string;
  tx: {
    type: number;
    from: string;
    to?: string;
    value: string;
    gasLimit: number;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    accessList?: any[];
    data?: string;
    contractAddress?: string;
  };
  decoded?: {
    selector: string;
    fnSig: string;
    args: string[];
    abiSource: string;
  };
}

interface ReplayFile {
  schema_version: string;
  transactions: Transaction[];
}

async function fetchAbiFromEtherscan(address: string): Promise<any[] | null> {
  try {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${key}`;
    const { data } = await axios.get(url);
    
    if (data.status === "1") {
      return JSON.parse(data.result);
    } else {
      console.warn(`No ABI found for address ${address}: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ABI for ${address}:`, error);
    return null;
  }
}

async function decodeTransactionData(tx: Transaction): Promise<void> {
  if (!tx.tx.data || tx.tx.data === "0x") {
    return; // No data to decode
  }

  const address = tx.tx.to || tx.tx.contractAddress;
  if (!address) {
    return; // No target address
  }

  const abi = await fetchAbiFromEtherscan(address);
  if (!abi) {
    return; // No ABI available
  }

  try {
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseTransaction({ data: tx.tx.data });
    
    if (decoded) {
      tx.decoded = {
        selector: decoded.selector,
        fnSig: decoded.signature,
        args: decoded.args.map((arg: any) => arg.toString()),
        abiSource: "etherscan"
      };
      
      delete tx.tx.data;
      
      console.log(`Successfully decoded transaction ${tx.id}: ${decoded.signature}`);
    }
  } catch (error) {
    console.warn(`Failed to decode transaction ${tx.id}:`, error);
  }
}

async function main() {
  const replayFilePath = "replay.json";
  
  if (!fs.existsSync(replayFilePath)) {
    console.error(`Replay file ${replayFilePath} not found`);
    process.exit(1);
  }

  const replayData: ReplayFile = JSON.parse(fs.readFileSync(replayFilePath, "utf8"));
  
  console.log(`Processing ${replayData.transactions.length} transactions...`);
  
  for (const tx of replayData.transactions) {
    if (tx.kind.startsWith("contractCall") || tx.kind === "contractCreation") {
      await decodeTransactionData(tx);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  fs.writeFileSync(
    replayFilePath, 
    JSON.stringify(replayData, null, 2)
  );
  
  console.log(`Updated replay file with decoded transaction data`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
