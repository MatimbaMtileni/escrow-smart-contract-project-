import { useState, useCallback } from "react";
import { useCardanoWallet } from "./useCardanoWallet";

export interface BalanceCheckResult {
  hasSufficientBalance: boolean;
  userBalance: bigint;
  requiredAmount: bigint;
  estimatedFee: bigint;
  totalRequired: bigint;
  shortfall: bigint;
}

/**
 * Hook for validating user balance against escrow amounts
 */
export function useBalanceValidation() {
  const { wallet } = useCardanoWallet();
  const [checking, setChecking] = useState(false);

  /**
   * Check if user has sufficient balance for transaction
   */
  const checkBalance = useCallback(
    async (
      amountLovelace: bigint,
      estimatedFeeLovelace: bigint = BigInt(200000)
    ): Promise<BalanceCheckResult> => {
      setChecking(true);

      try {
        if (!wallet?.isConnected) {
          throw new Error("Wallet not connected");
        }

        const userBalance = BigInt(wallet.balance);
        const totalRequired = amountLovelace + estimatedFeeLovelace;
        const hasSufficientBalance = userBalance >= totalRequired;
        const shortfall = hasSufficientBalance
          ? BigInt(0)
          : totalRequired - userBalance;

        return {
          hasSufficientBalance,
          userBalance,
          requiredAmount: amountLovelace,
          estimatedFee: estimatedFeeLovelace,
          totalRequired,
          shortfall,
        };
      } finally {
        setChecking(false);
      }
    },
    [wallet?.isConnected, wallet?.balance]
  );

  /**
   * Format lovelace to ADA for display
   */
  const formatADA = useCallback((lovelace: bigint): string => {
    const ada = Number(lovelace) / 1000000;
    return ada.toFixed(2);
  }, []);

  return {
    checkBalance,
    formatADA,
    checking,
    walletConnected: wallet?.isConnected || false,
    userBalance: wallet?.balance || "0",
  };
}
