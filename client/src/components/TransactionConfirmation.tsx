import { Card } from "@/components/ui/card";
import { ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface TransactionConfirmationProps {
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  onStatusChange?: (status: "pending" | "confirmed" | "failed") => void;
}

export function TransactionConfirmation({
  txHash,
  status: initialStatus,
  onStatusChange,
}: TransactionConfirmationProps) {
  const [status, setStatus] = useState<"pending" | "confirmed" | "failed">(
    initialStatus
  );
  const [confirmations, setConfirmations] = useState(0);

  // Simulate confirmation checking (in production, query blockchain)
  useEffect(() => {
    if (status === "pending") {
      const timer = setTimeout(() => {
        setConfirmations((c) => c + 1);
        if (confirmations >= 2) {
          setStatus("confirmed");
          onStatusChange?.("confirmed");
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, confirmations, onStatusChange]);

  const explorerUrl = `https://preprod.cexplorer.io/tx/${txHash}`;

  if (status === "confirmed") {
    return (
      <Card className="hud-border-green bg-black/40 backdrop-blur-sm border-green-500/50 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-3">
              TRANSACTION CONFIRMED
            </h3>
            <div className="space-y-2 text-xs mb-4">
              <div>
                <span className="text-muted-foreground">Transaction Hash</span>
                <p className="text-cyan-400 font-mono break-all">{txHash}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Confirmations</span>
                <p className="text-green-400 font-mono">{confirmations}+</p>
              </div>
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-xs underline"
            >
              View on Cardano Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "failed") {
    return (
      <Card className="hud-border-red bg-black/40 backdrop-blur-sm border-red-500/50 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-3">
              TRANSACTION FAILED
            </h3>
            <div className="space-y-2 text-xs mb-4">
              <div>
                <span className="text-muted-foreground">Transaction Hash</span>
                <p className="text-cyan-400 font-mono break-all">{txHash}</p>
              </div>
              <p className="text-red-400 text-xs">
                The transaction failed to confirm. Please try again.
              </p>
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-xs underline"
            >
              View on Cardano Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card>
    );
  }

  // Pending status
  return (
    <Card className="hud-border-cyan bg-black/40 backdrop-blur-sm border-cyan-500/50 p-6">
      <div className="flex items-start gap-4">
        <Loader2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5 animate-spin" />
        <div className="flex-1">
          <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-3">
            TRANSACTION PENDING
          </h3>
          <div className="space-y-2 text-xs mb-4">
            <div>
              <span className="text-muted-foreground">Transaction Hash</span>
              <p className="text-cyan-400 font-mono break-all">{txHash}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="text-yellow-400 font-mono">
                Waiting for blockchain confirmation... ({confirmations} checks)
              </p>
            </div>
          </div>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-xs underline"
          >
            View on Cardano Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
