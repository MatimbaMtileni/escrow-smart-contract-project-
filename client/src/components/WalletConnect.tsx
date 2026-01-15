import { useCardanoWallet } from "@/hooks/useCardanoWallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, LogOut, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function WalletConnect() {
  const {
    wallet,
    loading,
    error,
    isWalletAvailable,
    connectWallet,
    disconnectWallet,
  } = useCardanoWallet();

  const [showDetails, setShowDetails] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      toast.error(message);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.info("Wallet disconnected");
  };

  if (!isWalletAvailable) {
    return (
      <Card className="hud-border-cyan bg-black/60 backdrop-blur-sm border-cyan-500/50 p-4">
        <div className="flex items-center gap-3 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">Lace Wallet Not Found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Install Lace from{" "}
              <a
                href="https://www.lace.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                lace.io
              </a>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (wallet?.isConnected) {
    return (
      <Card className="hud-border-cyan bg-black/60 backdrop-blur-sm border-cyan-500/50 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 font-bold text-sm">WALLET CONNECTED</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left p-2 bg-black/40 border border-cyan-500/20 rounded hover:border-cyan-500/50 transition-all"
          >
            <p className="text-xs text-muted-foreground">ADDRESS</p>
            <p className="text-cyan-400 font-mono text-xs truncate">
              {wallet.address}
            </p>
          </button>

          {showDetails && (
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground">NETWORK</p>
                <p className="text-green-400 font-bold">{wallet.network}</p>
              </div>
              <div>
                <p className="text-muted-foreground">BALANCE</p>
                <p className="text-pink-400 font-bold">
                  {(BigInt(wallet.balance) / BigInt(1000000)).toString()} ₳
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="hud-border-pink bg-black/60 backdrop-blur-sm border-pink-500/50 p-4">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full btn-neon-pink text-sm flex items-center justify-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        {loading ? "CONNECTING..." : "CONNECT LACE WALLET"}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}
    </Card>
  );
}
