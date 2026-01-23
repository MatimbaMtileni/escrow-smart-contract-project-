/**
 * Cardano Escrow Smart Contract Configuration
 * 
 * This module provides the compiled Plutus script and utilities for interacting
 * with the multi-signature escrow contract on Cardano testnet.
 * 
 * Contract Logic:
 * - Approve: Official signs once before deadline (unique approval validation)
 * - Release: Before deadline + approvals >= required + beneficiary signature
 * - Refund: After deadline + insufficient approvals + depositor signature
 */

export const TESTNET_NETWORK = "Preprod"; // Cardano Preprod testnet

/**
 * Compiled Plutus V2 script for the escrow contract.
 * This is the CBORX hex representation of the validator.
 * In production, this would be compiled from the Haskell Plutus code.
 */
export const ESCROW_SCRIPT_CBOR = 
  "5e1000d8799f581c581c581c581cffa" + // Placeholder - actual compiled script
  "581c581cffa581c581cffa581c581cffa" +
  "581c581cffa581c581cffa581c581cffa" +
  "581c581cffa581c581cffa581c581cffa" +
  "581c581cffa581c581cffa581c581cffa" +
  "581c581cffa581c581cffa581c581cffa" +
  "581c581cffa581c581cffa581c581cffa" +
  "581c581cffa581c581cffa581c581cffa" +
  "581c581cffa581c581cffa581c581cffa";

/**
 * Escrow Datum structure matching the Haskell contract
 */
export interface EscrowDatum {
  depositor: string; // PubKeyHash (28 bytes hex)
  beneficiary: string; // PubKeyHash
  officials: string[]; // List of official PubKeyHashes
  approvals: string[]; // Collected approvals so far
  required: number; // n-of-m threshold
  deadline: number; // POSIX timestamp in milliseconds
}

/**
 * Escrow Action (Redeemer) - determines which validation rule applies
 */
export enum EscrowAction {
  Approve = 0,
  Release = 1,
  Refund = 2,
}

/**
 * Testnet configuration
 */
export const CARDANO_CONFIG = {
  network: TESTNET_NETWORK,
  kupoUrl: "https://kupo.preprod.cardano-testnet.iohk.io",
  ogmiosUrl: "wss://ogmios.preprod.cardano-testnet.iohk.io",
  blockfrostUrl: "https://cardano-preprod.blockfrost.io/api/v0",
  minFee: 200000, // 0.2 ADA minimum fee in lovelace
  minUtxo: 1000000, // 1 ADA minimum UTxO value in lovelace
};

/**
 * Script hash - would be derived from compiled script in production
 * For now, this is a placeholder that should be updated after contract deployment
 */
export const SCRIPT_HASH = "placeholder_script_hash_28_bytes";

/**
 * Contract address on testnet
 * Format: addr_test1 + script hash
 */
export const CONTRACT_ADDRESS = `addr_test1w${SCRIPT_HASH}`;
