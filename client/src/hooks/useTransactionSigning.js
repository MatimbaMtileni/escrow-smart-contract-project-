import { useState, useCallback } from "react";
import { useCardanoWallet } from "./useCardanoWallet";
import { trpc } from "@/lib/trpc";

export interface SigningResult {
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  error?: string;
}

/**
 * Hook for signing and submitting transactions with Lace wallet
 */
export function useTransactionSigning() {
  const { wallet, signTransaction, submitTransaction } = useCardanoWallet();
  const [signing, setSigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitTxMutation = trpc.system.notifyOwner.useMutation();
  const checkTxStatusQuery = trpc.escrow.checkTxStatus.useQuery;

  /**
   * Sign and submit a transaction
   */
  const signAndSubmit = useCallback(
    async (txHex: string, description?: string): Promise<SigningResult> => {
      setError(null);

      if (!wallet?.isConnected) {
        const err = "Wallet not connected";
        setError(err);
        throw new Error(err);
      }

      try {
        // Step 1: Sign transaction with wallet
        setSigning(true);
        console.log("Requesting wallet signature...");
        const signedTx = await signTransaction(txHex);

        if (!signedTx) {
          throw new Error("Wallet signature failed");
        }

        console.log("Transaction signed successfully");

        // Step 2: Submit signed transaction to blockchain
        setSubmitting(true);
        console.log("Submitting transaction to blockchain...");

        // Submit to blockchain via wallet
        const txHash = await submitTransaction(signedTx);

        if (!txHash) {
          throw new Error("Transaction submission failed - no hash returned");
        }

        console.log("Transaction submitted with hash:", txHash);

        // Notify owner of transaction
        if (description) {
          try {
            await submitTxMutation.mutateAsync({
              title: "Escrow Transaction Submitted",
              content: `${description}\n\nTransaction Hash: ${txHash}\n\nView on explorer: https://preprod.cexplorer.io/tx/${txHash}`,
            });
          } catch (err) {
            console.log("Could not notify owner:", err);
          }
        }

        return {
          txHash,
          status: "pending",
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown signing error";
        setError(errorMsg);
        console.error("Transaction signing failed:", err);
        throw err;
      } finally {
        setSigning(false);
        setSubmitting(false);
      }
    },
    [wallet?.isConnected, signTransaction, submitTransaction, submitTxMutation]
  );

  /**
   * Check transaction status on blockchain via Blockfrost
   */
  const checkStatus = useCallback(
    async (txHash: string): Promise<{
      status: "pending" | "confirmed" | "failed";
      confirmations: number;
      blockHeight: number | null;
      timestamp: number | null;
    }> => {
      try {
        // Query backend which will call Blockfrost
        const result = await (checkTxStatusQuery as any)({ txHash }).then(
          (res: any) => res.data
        );
        return result || {
          status: "pending",
          confirmations: 0,
          blockHeight: null,
          timestamp: null,
        };
      } catch (err) {
        console.error("Failed to check transaction status:", err);
        return {
          status: "pending",
          confirmations: 0,
          blockHeight: null,
          timestamp: null,
        };
      }
    },
    [checkTxStatusQuery]
  );

  return {
    signAndSubmit,
    checkStatus,
    signing,
    submitting,
    error,
    walletConnected: wallet?.isConnected || false,
  };
}
