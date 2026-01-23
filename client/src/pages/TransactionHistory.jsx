import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";

export default function TransactionHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: escrows = [] } = trpc.escrow.getAllEscrows.useQuery();
  const [isLoading, setIsLoading] = React.useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "lock":
        return "text-pink-400";
      case "approve":
        return "text-cyan-400";
      case "release":
        return "text-green-400";
      case "refund":
        return "text-orange-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "lock":
        return "🔒";
      case "approve":
        return "✓";
      case "release":
        return "💰";
      case "refund":
        return "↩";
      default:
        return "→";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 scanlines">
      {/* Header */}
      <div className="border-b border-pink-500/30 bg-black/40 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold neon-glow-pink mb-2">TRANSACTION HISTORY</h1>
              <p className="text-cyan-400 text-sm tracking-widest">COMPLETE AUDIT TRAIL</p>
            </div>
            <button
              onClick={() => setLocation("/dashboard")}
              className="btn-neon-cyan text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> DASHBOARD
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-4xl">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-pink-400 mx-auto mb-4" />
            <p className="text-cyan-400 tracking-widest">LOADING TRANSACTIONS...</p>
          </div>
        ) : escrows.length === 0 ? (
          <Card className="hud-border bg-black/60 backdrop-blur-sm border-pink-500/50 p-8 text-center">
            <p className="text-muted-foreground text-lg mb-4">NO ESCROW CONTRACTS FOUND</p>
            <p className="text-sm text-muted-foreground">
              Create escrow contracts to see transaction history
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {escrows.map((escrow: any) => (
              <Card
                key={escrow.contractId}
                className="hud-border bg-black/60 backdrop-blur-sm border-cyan-500/50 hover:border-cyan-400/80 transition-all p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getTransactionIcon(escrow.status)}</span>
                      <div>
                        <h3 className={`font-bold text-sm uppercase tracking-wider ${getTransactionColor(escrow.status)}`}>
                          {escrow.status}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          Contract: {escrow.contractId.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {escrow.amount} units • {escrow.currentApprovals}/{escrow.requiredApprovals} approvals
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">CREATED</span>
                        <p className="text-cyan-400 font-mono">
                          {formatDate(escrow.createdAt.toString())}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">DEADLINE</span>
                        <p className="text-yellow-400 font-mono">
                          {formatDate(new Date(parseInt(escrow.deadline, 10)).toString())}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setLocation(`/escrow/${escrow.contractId}`)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0"
                    title="View escrow details"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="hud-border-pink bg-black/40 backdrop-blur-sm border-pink-500/50 p-6 mt-8">
          <h3 className="text-pink-400 font-bold text-sm uppercase tracking-wider mb-3">
            About This History
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• All escrow operations are logged with timestamps</li>
            <li>• Blockchain transaction hashes link to Cardano Preprod explorer</li>
            <li>• Lock: Funds deposited into escrow contract</li>
            <li>• Approve: Official signature recorded</li>
            <li>• Release: Funds transferred to beneficiary</li>
            <li>• Refund: Funds returned to depositor</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
