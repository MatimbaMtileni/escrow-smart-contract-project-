import { useState, useEffect, useCallback } from "react";

export interface CardanoWallet {
  address: string;
  pubKeyHash: string;
  balance: string;
  isConnected: boolean;
  network: "Preprod" | "Mainnet";
}

/**
 * Hook for Lace wallet connection and management
 * 
 * Lace is injected as window.cardano.lace
 * Uses Lace-specific API (not standard CIP-30)
 */
export function useCardanoWallet() {
  const [wallet, setWallet] = useState<CardanoWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if Lace wallet is available
   */
  const isWalletAvailable = useCallback(() => {
    return typeof window !== "undefined" && 
           (window as any).cardano?.lace !== undefined;
  }, []);

  /**
   * Connect to Lace wallet using Lace-specific API
   */
  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isWalletAvailable()) {
        throw new Error(
          "Lace wallet not found. Please install it from https://www.lace.io"
        );
      }

      const lace = (window as any).cardano.lace;

      // Request wallet connection
      const enabled = await lace.enable();

      if (!enabled) {
        throw new Error("Failed to enable wallet");
      }

      // Get address using Lace API
      // Lace returns the address directly
      let address = "";
      
      // Try different Lace API methods
      if (typeof lace.getAddress === "function") {
        address = await lace.getAddress();
      } else if (typeof lace.getChangeAddress === "function") {
        address = await lace.getChangeAddress();
      } else if (typeof lace.getAddresses === "function") {
        const addresses = await lace.getAddresses();
        if (Array.isArray(addresses) && addresses.length > 0) {
          address = addresses[0];
        }
      } else {
        throw new Error("Could not retrieve address from Lace wallet");
      }

      if (!address) {
        throw new Error("No address found in wallet");
      }

      // Get balance using Lace API
      let balance = "0";
      try {
        if (typeof lace.getBalance === "function") {
          const balanceHex = await lace.getBalance();
          balance = BigInt(balanceHex).toString();
        }
      } catch (err) {
        console.log("Could not fetch balance:", err);
        balance = "0";
      }

      // Extract pubKeyHash from address
      const pubKeyHash = address.slice(0, 56);

      // Determine network from address prefix
      const isTestnet = address.startsWith("addr_test");
      const network = isTestnet ? "Preprod" : "Mainnet";

      if (!isTestnet) {
        throw new Error("Please switch to Preprod testnet in your Lace wallet");
      }

      setWallet({
        address,
        pubKeyHash,
        balance,
        isConnected: true,
        network,
      });

      return {
        address,
        pubKeyHash,
        balance,
        isConnected: true,
        network,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      setWallet(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isWalletAvailable]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setError(null);
  }, []);

  /**
   * Sign transaction with wallet
   */
  const signTransaction = useCallback(
    async (txHex: string): Promise<string> => {
      if (!wallet?.isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        const lace = (window as any).cardano.lace;
        
        // Try Lace signTx method
        if (typeof lace.signTx === "function") {
          const signedTx = await lace.signTx(txHex, true); // true = partial sign
          return signedTx;
        } else if (typeof lace.signMessage === "function") {
          // Fallback to signMessage if available
          const signed = await lace.signMessage(txHex);
          return signed;
        } else {
          throw new Error("Wallet does not support transaction signing");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Signing failed";
        setError(errorMsg);
        throw err;
      }
    },
    [wallet?.isConnected]
  );

  /**
   * Submit transaction to blockchain
   */
  const submitTransaction = useCallback(
    async (signedTxHex: string): Promise<string> => {
      if (!wallet?.isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        const lace = (window as any).cardano.lace;
        
        // Try Lace submitTx method
        if (typeof lace.submitTx === "function") {
          const txHash = await lace.submitTx(signedTxHex);
          return txHash;
        } else {
          throw new Error("Wallet does not support transaction submission");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Submission failed";
        setError(errorMsg);
        throw err;
      }
    },
    [wallet?.isConnected]
  );

  /**
   * Check wallet connection on mount
   */
  useEffect(() => {
    const checkConnection = async () => {
      if (isWalletAvailable()) {
        try {
          const lace = (window as any).cardano.lace;
          
          // Try to get address without enabling (checks if already connected)
          try {
            let address = "";
            if (typeof lace.getAddress === "function") {
              address = await lace.getAddress();
            } else if (typeof lace.getChangeAddress === "function") {
              address = await lace.getChangeAddress();
            }
            
            if (address) {
              // Already connected, auto-connect
              await connectWallet();
            }
          } catch (err) {
            // Not connected yet, that's fine
            console.log("Wallet not yet connected");
          }
        } catch (err) {
          console.log("Wallet auto-connect check failed:", err);
        }
      }
    };

    checkConnection();
  }, [isWalletAvailable, connectWallet]);

  return {
    wallet,
    loading,
    error,
    isWalletAvailable: isWalletAvailable(),
    connectWallet,
    disconnectWallet,
    signTransaction,
    submitTransaction,
  };
}
