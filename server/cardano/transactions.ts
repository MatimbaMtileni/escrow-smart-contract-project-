/**
 * Cardano Transaction Builders
 * 
 * Builds unsigned transactions for all escrow operations using Lucid
 */

import { Lucid } from "lucid-cardano";
import { EscrowDatum, EscrowAction, CARDANO_CONFIG } from "./contract";

/**
 * Build transaction to lock funds in escrow
 * 
 * Sends ADA to script address with escrow datum
 */
export async function buildLockTransaction(
  lucid: Lucid,
  contractAddress: string,
  datum: EscrowDatum,
  amountLovelace: bigint,
  userAddress: string
): Promise<string> {
  try {
    // Build transaction
    const tx = await lucid
      .newTx()
      .payToContract(
        contractAddress,
        { inline: datum as any },
        { lovelace: amountLovelace }
      )
      .complete();

    // Return unsigned transaction CBOR
    return tx.toString();
  } catch (err) {
    throw new Error(`Failed to build lock transaction: ${err}`);
  }
}

/**
 * Build transaction for official to approve escrow
 * 
 * Spends existing UTXO and updates datum with new approval
 */
export async function buildApproveTransaction(
  lucid: Lucid,
  contractAddress: string,
  utxoRef: any,
  oldDatum: EscrowDatum,
  newDatum: EscrowDatum,
  userAddress: string
): Promise<string> {
  try {
    const redeemer = EscrowAction.Approve;

    // Build transaction
    const tx = await lucid
      .newTx()
      .collectFrom([utxoRef], redeemer as any)
      .payToContract(
        contractAddress,
        { inline: newDatum as any },
        { lovelace: utxoRef.assets.lovelace }
      )
      .addSigner(userAddress)
      .complete();

    return tx.toString();
  } catch (err) {
    throw new Error(`Failed to build approve transaction: ${err}`);
  }
}

/**
 * Build transaction for beneficiary to release funds
 * 
 * Spends UTXO from script and sends funds to beneficiary
 */
export async function buildReleaseTransaction(
  lucid: Lucid,
  contractAddress: string,
  utxoRef: any,
  datum: EscrowDatum,
  beneficiaryAddress: string
): Promise<string> {
  try {
    const redeemer = EscrowAction.Release;

    // Build transaction
    const tx = await lucid
      .newTx()
      .collectFrom([utxoRef], redeemer as any)
      .payToAddress(beneficiaryAddress, { lovelace: utxoRef.assets.lovelace })
      .addSigner(beneficiaryAddress)
      .complete();

    return tx.toString();
  } catch (err) {
    throw new Error(`Failed to build release transaction: ${err}`);
  }
}

/**
 * Build transaction for depositor to refund after deadline
 * 
 * Spends UTXO from script and returns funds to depositor
 */
export async function buildRefundTransaction(
  lucid: Lucid,
  contractAddress: string,
  utxoRef: any,
  datum: EscrowDatum,
  depositorAddress: string
): Promise<string> {
  try {
    const redeemer = EscrowAction.Refund;

    // Build transaction
    const tx = await lucid
      .newTx()
      .collectFrom([utxoRef], redeemer as any)
      .payToAddress(depositorAddress, { lovelace: utxoRef.assets.lovelace })
      .addSigner(depositorAddress)
      .complete();

    return tx.toString();
  } catch (err) {
    throw new Error(`Failed to build refund transaction: ${err}`);
  }
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  lucid: Lucid,
  txHex: string
): Promise<bigint> {
  try {
    // Parse the transaction and estimate fee
    // For now, return minimum fee
    return BigInt(CARDANO_CONFIG.minFee);
  } catch (err) {
    return BigInt(CARDANO_CONFIG.minFee);
  }
}

/**
 * Get current UTXO at contract address
 */
export async function getContractUTXO(
  lucid: Lucid,
  contractAddress: string
): Promise<any | null> {
  try {
    const utxos = await lucid.utxosAt(contractAddress);
    return utxos.length > 0 ? utxos[0] : null;
  } catch (err) {
    throw new Error(`Failed to get contract UTXO: ${err}`);
  }
}

/**
 * Get user's UTXOs for fees
 */
export async function getUserUTXOs(
  lucid: Lucid,
  userAddress: string
): Promise<any[]> {
  try {
    return await lucid.utxosAt(userAddress);
  } catch (err) {
    throw new Error(`Failed to get user UTXOs: ${err}`);
  }
}

/**
 * Calculate total balance from UTXOs
 */
export function calculateBalance(utxos: any[]): bigint {
  return utxos.reduce((sum, utxo) => {
    return sum + (BigInt(utxo.assets.lovelace) || BigInt(0));
  }, BigInt(0));
}
