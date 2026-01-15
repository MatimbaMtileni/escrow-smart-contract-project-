/**
 * Blockfrost API Integration
 * 
 * Provides real-time blockchain monitoring and transaction status checking
 */

import axios from "axios";
import { ENV } from "../_core/env";

const BLOCKFROST_BASE_URL = "https://cardano-preprod.blockfrost.io/api/v0";

/**
 * Get transaction status from blockchain
 */
export async function getTransactionStatus(txHash: string): Promise<{
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  blockHeight: number | null;
  timestamp: number | null;
}> {
  try {
    if (!ENV.blockfrostApiKey) {
      throw new Error("Blockfrost API key not configured");
    }

    const response = await axios.get(`${BLOCKFROST_BASE_URL}/txs/${txHash}`, {
      headers: {
        project_id: ENV.blockfrostApiKey,
      },
    });

    const data = response.data;

    return {
      status: data.block ? "confirmed" : "pending",
      confirmations: data.confirmations || 0,
      blockHeight: data.block_height || null,
      timestamp: data.block_time ? data.block_time * 1000 : null,
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      return {
        status: "pending",
        confirmations: 0,
        blockHeight: null,
        timestamp: null,
      };
    }
    throw new Error(`Failed to get transaction status: ${err.message}`);
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(address: string): Promise<bigint> {
  try {
    if (!ENV.blockfrostApiKey) {
      throw new Error("Blockfrost API key not configured");
    }

    const response = await axios.get(`${BLOCKFROST_BASE_URL}/addresses/${address}`, {
      headers: {
        project_id: ENV.blockfrostApiKey,
      },
    });

    const data = response.data;
    const lovelace = data.amount?.find((a: any) => a.unit === "lovelace")?.quantity || "0";

    return BigInt(lovelace);
  } catch (err: any) {
    throw new Error(`Failed to get wallet balance: ${err.message}`);
  }
}

/**
 * Get UTXOs at address
 */
export async function getAddressUTXOs(address: string): Promise<any[]> {
  try {
    if (!ENV.blockfrostApiKey) {
      throw new Error("Blockfrost API key not configured");
    }

    const response = await axios.get(`${BLOCKFROST_BASE_URL}/addresses/${address}/utxos`, {
      headers: {
        project_id: ENV.blockfrostApiKey,
      },
    });

    return response.data || [];
  } catch (err: any) {
    throw new Error(`Failed to get UTXOs: ${err.message}`);
  }
}

/**
 * Get network parameters
 */
export async function getNetworkParameters(): Promise<{
  minFeeA: number;
  minFeeB: number;
  maxTxSize: number;
  maxBlockHeaderSize: number;
  keyDeposit: bigint;
  poolDeposit: bigint;
  minPoolCost: bigint;
  priceMem: number;
  priceSteps: number;
  maxTxExecutionUnits: {
    mem: number;
    steps: number;
  };
  maxBlockExecutionUnits: {
    mem: number;
    steps: number;
  };
  maxValueSize: number;
  collateralPercentage: number;
  maxCollateralInputs: number;
  coinsPerUtxoWord: bigint;
}> {
  try {
    if (!ENV.blockfrostApiKey) {
      throw new Error("Blockfrost API key not configured");
    }

    const response = await axios.get(`${BLOCKFROST_BASE_URL}/genesis`, {
      headers: {
        project_id: ENV.blockfrostApiKey,
      },
    });

    const data = response.data;

    return {
      minFeeA: data.min_fee_a,
      minFeeB: data.min_fee_b,
      maxTxSize: data.max_tx_size,
      maxBlockHeaderSize: data.max_block_header_size,
      keyDeposit: BigInt(data.key_deposit),
      poolDeposit: BigInt(data.pool_deposit),
      minPoolCost: BigInt(data.min_pool_cost),
      priceMem: data.price_memory,
      priceSteps: data.price_steps,
      maxTxExecutionUnits: {
        mem: data.max_tx_execution_units.mem,
        steps: data.max_tx_execution_units.steps,
      },
      maxBlockExecutionUnits: {
        mem: data.max_block_execution_units.mem,
        steps: data.max_block_execution_units.steps,
      },
      maxValueSize: data.max_value_size,
      collateralPercentage: data.collateral_percentage,
      maxCollateralInputs: data.max_collateral_inputs,
      coinsPerUtxoWord: BigInt(data.coins_per_utxo_word),
    };
  } catch (err: any) {
    throw new Error(`Failed to get network parameters: ${err.message}`);
  }
}

/**
 * Submit transaction to blockchain
 */
export async function submitTransaction(txHex: string): Promise<string> {
  try {
    if (!ENV.blockfrostApiKey) {
      throw new Error("Blockfrost API key not configured");
    }

    const response = await axios.post(
      `${BLOCKFROST_BASE_URL}/tx/submit`,
      txHex,
      {
        headers: {
          project_id: ENV.blockfrostApiKey,
          "Content-Type": "application/cbor",
        },
      }
    );

    return response.data;
  } catch (err: any) {
    throw new Error(`Failed to submit transaction: ${err.message}`);
  }
}
