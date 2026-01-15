import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BalanceCheck } from "@/components/BalanceCheck";
import { TransactionConfirmation } from "@/components/TransactionConfirmation";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function LockFunds() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const lockMutation = trpc.escrow.lock.useMutation();

  const [formData, setFormData] = useState({
    beneficiaryId: "",
    amount: "",
    requiredApprovals: "2",
    deadlineHours: "24",
    description: "",
    officialIds: "",
  });

  const [isValidBalance, setIsValidBalance] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<"pending" | "confirmed" | "failed">("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.beneficiaryId || !formData.amount || !formData.officialIds) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isValidBalance) {
      toast.error("Insufficient balance for this transaction");
      return;
    }

    const officialIds = formData.officialIds
      .split(",")
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    if (officialIds.length === 0) {
      toast.error("Please enter at least one official ID");
      return;
    }

    const requiredApprovals = parseInt(formData.requiredApprovals, 10);
    if (requiredApprovals > officialIds.length) {
      toast.error("Required approvals cannot exceed number of officials");
      return;
    }

    setIsSubmitting(true);

    try {
      const deadlineMs = Date.now() + parseInt(formData.deadlineHours, 10) * 60 * 60 * 1000;

      const result = await lockMutation.mutateAsync({
        beneficiaryId: parseInt(formData.beneficiaryId, 10),
        officialIds,
        amount: formData.amount,
        requiredApprovals,
        deadlineMs,
        description: formData.description,
      });

      // Simulate transaction hash for demo
      const mockTxHash = `${Math.random().toString(16).slice(2)}`;
      setTxHash(mockTxHash);
      setTxStatus("pending");

      toast.success("Escrow created! Waiting for blockchain confirmation...");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create escrow";
      toast.error(message);
      setTxStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountLovelace = formData.amount ? BigInt(parseInt(formData.amount, 10) * 1000000) : BigInt(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 scanlines">
      {/* Header */}
      <div className="border-b border-pink-500/30 bg-black/40 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold neon-glow-pink mb-2">LOCK FUNDS</h1>
              <p className="text-cyan-400 text-sm tracking-widest">CREATE NEW ESCROW CONTRACT</p>
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
      <div className="container py-12 max-w-2xl">
        {txHash ? (
          <div className="space-y-6">
            <TransactionConfirmation
              txHash={txHash}
              status={txStatus}
              onStatusChange={setTxStatus}
            />
            <button
              onClick={() => {
                setTxHash(null);
                setFormData({
                  beneficiaryId: "",
                  amount: "",
                  requiredApprovals: "2",
                  deadlineHours: "24",
                  description: "",
                  officialIds: "",
                });
              }}
              className="w-full btn-neon-pink"
            >
              CREATE ANOTHER ESCROW
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Balance Check */}
            <div>
              <Label className="text-cyan-400 font-bold mb-3 block">WALLET BALANCE</Label>
              <BalanceCheck
                amountLovelace={amountLovelace}
                estimatedFeeLovelace={BigInt(200000)}
                onValidationChange={setIsValidBalance}
              />
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="text-cyan-400 font-bold mb-2 block">
                ESCROW AMOUNT (ADA) *
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g., 10"
                value={formData.amount}
                onChange={handleChange}
                className="hud-input"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Amount in ADA to lock in the escrow contract
              </p>
            </div>

            {/* Beneficiary ID */}
            <div>
              <Label htmlFor="beneficiaryId" className="text-cyan-400 font-bold mb-2 block">
                BENEFICIARY USER ID *
              </Label>
              <Input
                id="beneficiaryId"
                name="beneficiaryId"
                type="number"
                placeholder="e.g., 2"
                value={formData.beneficiaryId}
                onChange={handleChange}
                className="hud-input"
                required
              />
            </div>

            {/* Officials */}
            <div>
              <Label htmlFor="officialIds" className="text-cyan-400 font-bold mb-2 block">
                OFFICIAL IDS (COMMA-SEPARATED) *
              </Label>
              <Input
                id="officialIds"
                name="officialIds"
                placeholder="e.g., 3,4,5"
                value={formData.officialIds}
                onChange={handleChange}
                className="hud-input"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                List of officials who can approve this escrow
              </p>
            </div>

            {/* Required Approvals */}
            <div>
              <Label htmlFor="requiredApprovals" className="text-cyan-400 font-bold mb-2 block">
                REQUIRED APPROVALS
              </Label>
              <Input
                id="requiredApprovals"
                name="requiredApprovals"
                type="number"
                min="1"
                value={formData.requiredApprovals}
                onChange={handleChange}
                className="hud-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of officials who must approve before release
              </p>
            </div>

            {/* Deadline */}
            <div>
              <Label htmlFor="deadlineHours" className="text-cyan-400 font-bold mb-2 block">
                DEADLINE (HOURS)
              </Label>
              <Input
                id="deadlineHours"
                name="deadlineHours"
                type="number"
                min="1"
                value={formData.deadlineHours}
                onChange={handleChange}
                className="hud-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hours until escrow expires (can be refunded if approvals insufficient)
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-cyan-400 font-bold mb-2 block">
                DESCRIPTION
              </Label>
              <textarea
                id="description"
                name="description"
                placeholder="Optional: Describe the purpose of this escrow..."
                value={formData.description}
                onChange={handleChange}
                className="hud-input min-h-24 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isValidBalance}
              className="w-full btn-neon-pink disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "PROCESSING..." : "🔒 LOCK FUNDS"}
            </button>

            {!isValidBalance && formData.amount && (
              <p className="text-xs text-red-400 text-center">
                ⚠ Insufficient balance to proceed
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
