import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { Clock, CheckCircle, XCircle, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EscrowDetails() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/escrow/:contractId");
  const contractId = params?.contractId as string;

  const { data: escrow, isLoading: isLoadingEscrow } = trpc.escrow.getDetails.useQuery(
    { contractId },
    { enabled: !!contractId }
  );

  const { data: transactions = [], isLoading: isLoadingTransactions } = trpc.escrow.getTransactionHistory.useQuery(
    { contractId },
    { enabled: !!contractId }
  );

  const approveMutation = trpc.escrow.approve.useMutation();
  const releaseMutation = trpc.escrow.release.useMutation();
  const refundMutation = trpc.escrow.refund.useMutation();

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ contractId });
      toast.success("Approval recorded successfully");
      setShowApproveConfirm(false);
    } catch (error) {
      toast.error("Failed to approve escrow");
      console.error(error);
    }
  };

  const handleRelease = async () => {
    try {
      await releaseMutation.mutateAsync({ contractId });
      toast.success("Funds released successfully");
      setShowReleaseConfirm(false);
    } catch (error) {
      toast.error("Failed to release funds");
      console.error(error);
    }
  };

  const handleRefund = async () => {
    try {
      await refundMutation.mutateAsync({ contractId });
      toast.success("Refund processed successfully");
      setShowRefundConfirm(false);
    } catch (error) {
      toast.error("Failed to refund funds");
      console.error(error);
    }
  };

  const isDeadlinePassed = escrow ? Date.now() > parseInt(escrow.deadline, 10) : false;
  const isApprovalSufficient = escrow ? escrow.currentApprovals >= escrow.requiredApprovals : false;
  const isOfficial = escrow ? escrow.officials.some(o => o.officialId === user?.id) : false;
  const hasApproved = escrow ? escrow.officials.some(o => o.officialId === user?.id && o.hasApproved === 1) : false;
  const isBeneficiary = escrow?.beneficiaryId === user?.id;
  const isDepositor = escrow?.depositorId === user?.id;

  if (isLoadingEscrow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 scanlines flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-400 mx-auto mb-4" />
          <p className="text-cyan-400 tracking-widest">LOADING ESCROW DATA...</p>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 scanlines">
        <div className="container py-12 text-center">
          <p className="text-pink-400 text-lg mb-4">ESCROW NOT FOUND</p>
          <button
            onClick={() => setLocation("/dashboard")}
            className="btn-neon-cyan"
          >
            ← BACK TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "approved":
        return "text-blue-400";
      case "released":
        return "text-green-400";
      case "refunded":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 scanlines">
      {/* Header */}
      <div className="border-b border-pink-500/30 bg-black/40 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold neon-glow-pink mb-2">ESCROW DETAILS</h1>
              <p className="font-mono text-cyan-400 text-xs">{contractId}</p>
            </div>
            <button
              onClick={() => setLocation("/dashboard")}
              className="btn-neon-cyan text-sm"
            >
              ← DASHBOARD
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 max-w-4xl">
        <div className="grid gap-6">
          {/* Status Card */}
          <Card className="hud-border bg-black/60 backdrop-blur-sm border-pink-500/50 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold neon-glow-pink mb-2">
                  {escrow.amount} UNITS
                </h2>
                <p className="text-muted-foreground text-sm">{escrow.description || "No description"}</p>
              </div>
              <div className={`text-right ${getStatusColor(escrow.status)}`}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1">STATUS</p>
                <p className="text-2xl font-bold">{escrow.status.toUpperCase()}</p>
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-pink-500/20">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Depositor</p>
                <p className="text-cyan-400 font-mono text-sm">ID: {escrow.depositorId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Beneficiary</p>
                <p className="text-cyan-400 font-mono text-sm">ID: {escrow.beneficiaryId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                <p className="text-cyan-400 font-mono text-sm">{formatDate(escrow.createdAt.toString())}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deadline</p>
                <p className={`font-mono text-sm ${isDeadlinePassed ? "text-red-400" : "text-yellow-400"}`}>
                  {formatDate(new Date(parseInt(escrow.deadline, 10)).toString())}
                </p>
              </div>
            </div>
          </Card>

          {/* Approvals Card */}
          <Card className="hud-border bg-black/60 backdrop-blur-sm border-cyan-500/50 p-8">
            <h3 className="text-lg font-bold neon-glow-cyan mb-6">APPROVAL STATUS</h3>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">PROGRESS</span>
                <span className="text-pink-400 font-bold">
                  {escrow.currentApprovals}/{escrow.requiredApprovals}
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-3 border border-cyan-500/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 transition-all duration-300"
                  style={{
                    width: `${(escrow.currentApprovals / escrow.requiredApprovals) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Officials List */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Officials</p>
              {escrow.officials.map((official) => (
                <div
                  key={official.id}
                  className="flex justify-between items-center p-3 bg-black/40 border border-cyan-500/20 rounded"
                >
                  <span className="font-mono text-sm text-cyan-400">ID: {official.officialId}</span>
                  <span className={`text-xs font-bold uppercase ${official.hasApproved === 1 ? "text-green-400" : "text-muted-foreground"}`}>
                    {official.hasApproved === 1 ? "✓ APPROVED" : "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions Card */}
          <Card className="hud-border bg-black/60 backdrop-blur-sm border-pink-500/50 p-8">
            <h3 className="text-lg font-bold neon-glow-pink mb-6">ACTIONS</h3>

            <div className="space-y-4">
              {/* Approve Button */}
              {isOfficial && !hasApproved && escrow.status === "pending" && !isDeadlinePassed && (
                <>
                  <button
                    onClick={() => setShowApproveConfirm(true)}
                    className="w-full btn-neon-cyan"
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? "APPROVING..." : "✓ APPROVE"}
                  </button>
                  {showApproveConfirm && (
                    <div className="p-4 bg-black/50 border border-yellow-500/50 rounded">
                      <p className="text-yellow-400 text-sm mb-3">Confirm approval?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApprove}
                          className="flex-1 btn-neon-pink text-sm"
                          disabled={approveMutation.isPending}
                        >
                          CONFIRM
                        </button>
                        <button
                          onClick={() => setShowApproveConfirm(false)}
                          className="flex-1 btn-neon-cyan text-sm"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Release Button */}
              {isBeneficiary && escrow.status === "pending" && !isDeadlinePassed && isApprovalSufficient && (
                <>
                  <button
                    onClick={() => setShowReleaseConfirm(true)}
                    className="w-full btn-neon-pink"
                    disabled={releaseMutation.isPending}
                  >
                    {releaseMutation.isPending ? "RELEASING..." : "💰 RELEASE FUNDS"}
                  </button>
                  {showReleaseConfirm && (
                    <div className="p-4 bg-black/50 border border-green-500/50 rounded">
                      <p className="text-green-400 text-sm mb-3">Release {escrow.amount} units?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRelease}
                          className="flex-1 btn-neon-pink text-sm"
                          disabled={releaseMutation.isPending}
                        >
                          CONFIRM
                        </button>
                        <button
                          onClick={() => setShowReleaseConfirm(false)}
                          className="flex-1 btn-neon-cyan text-sm"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Refund Button */}
              {isDepositor && escrow.status === "pending" && isDeadlinePassed && !isApprovalSufficient && (
                <>
                  <button
                    onClick={() => setShowRefundConfirm(true)}
                    className="w-full btn-neon-cyan"
                    disabled={refundMutation.isPending}
                  >
                    {refundMutation.isPending ? "REFUNDING..." : "↩ REFUND"}
                  </button>
                  {showRefundConfirm && (
                    <div className="p-4 bg-black/50 border border-orange-500/50 rounded">
                      <p className="text-orange-400 text-sm mb-3">Refund {escrow.amount} units?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRefund}
                          className="flex-1 btn-neon-pink text-sm"
                          disabled={refundMutation.isPending}
                        >
                          CONFIRM
                        </button>
                        <button
                          onClick={() => setShowRefundConfirm(false)}
                          className="flex-1 btn-neon-cyan text-sm"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* No Actions Available */}
              {!isOfficial && !isBeneficiary && !isDepositor && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  You have no actions available for this escrow
                </p>
              )}
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="hud-border bg-black/60 backdrop-blur-sm border-cyan-500/50 p-8">
            <h3 className="text-lg font-bold neon-glow-cyan mb-6">TRANSACTION HISTORY</h3>

            {isLoadingTransactions ? (
              <p className="text-muted-foreground text-sm">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-start p-3 bg-black/40 border border-cyan-500/20 rounded text-sm"
                  >
                    <div>
                      <p className="text-cyan-400 font-bold uppercase">{tx.transactionType}</p>
                      <p className="text-xs text-muted-foreground">{tx.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDate(tx.createdAt.toString())}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
