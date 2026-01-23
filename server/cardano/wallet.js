/**
 * Cardano Wallet Integration
 * 
 * Handles communication with Lace wallet and transaction building
 * using Lucid for testnet operations.
 */

import { Lucid, Blockfrost } from "lucid-cardano";
import { CARDANO_CONFIG } from "./contract";

let lucidInstance: Lucid | null = null;

/**
 * Initialize Lucid with Blockfrost provider for testnet
 */
export async function initializeLucid(): Promise<Lucid> {
  if (lucidInstance) {
    return lucidInstance;
  }

  const apiKey = process.env.BLOCKFROST_API_KEY || "test_key";
  
  lucidInstance = await Lucid.new(
    new Blockfrost(CARDANO_CONFIG.blockfrostUrl, apiKey),
    "Preprod"
  );

  return lucidInstance;
}

/**
 * Get Lucid instance (must be initialized first)
 */
export function getLucid(): Lucid {
  if (!lucidInstance) {
    throw new Error("Lucid not initialized. Call initializeLucid() first.");
  }
  return lucidInstance;
}

/**
 * Wallet connection info
 */
export interface WalletConnection {
  address: string;
  pubKeyHash: string;
  network: "Preprod" | "Mainnet";
  isConnected: boolean;
}

/**
 * Get UTxOs at contract address
 */
export async function getContractUtxos(contractAddress: string) {
  const lucid = getLucid();
  const utxos = await lucid.utxosAt(contractAddress);
  return utxos;
}

/**
 * Get user's UTxOs for fees
 */
export async function getUserUtxos(address: string) {
  const lucid = getLucid();
  const utxos = await lucid.utxosAt(address);
  return utxos;
}

/**
 * Get network parameters
 */
export async function getNetworkParams() {
  const lucid = getLucid();
  return {
    minFee: CARDANO_CONFIG.minFee,
    minUtxo: CARDANO_CONFIG.minUtxo,
    network: "Preprod",
  };
}
