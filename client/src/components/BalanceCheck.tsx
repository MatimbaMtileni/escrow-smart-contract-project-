import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Wallet } from "lucide-react";
import { useBalanceValidation } from "@/hooks/useBalanceValidation";
import { useEffect, useState } from "react";

interface BalanceCheckProps {
  amountLovelace: bigint;
  estimatedFeeLovelace?: bigint;
  onValidationChange?: (isValid: boolean) => void;
}

export function BalanceCheck({
  amountLovelace,
  estimatedFeeLovelace = BigInt(200000),
  onValidationChange,
}: BalanceCheckProps) {
  const { checkBalance, formatADA, walletConnected } = useBalanceValidation();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletConnected) {
      setResult(null);
      onValidationChange?.(false);
      return;
    }

    const validate = async () => {
      setLoading(true);
      try {
        const checkResult = await checkBalance(
          amountLovelace,
          estimatedFeeLovelace
        );
        setResult(checkResult);
        onValidationChange?.(checkResult.hasSufficientBalance);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [amountLovelace, estimatedFeeLovelace, walletConnected, checkBalance, onValidationChange]);

  if (!walletConnected) {
    return (
      <Card className="hud-border-pink bg-black/40 backdrop-blur-sm border-pink-500/50 p-4">
        <div className="flex items-center gap-3 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Connect wallet to check balance</p>
        </div>
      </Card>
    );
  }

  if (loading || !result) {
    return (
      <Card className="hud-border-cyan bg-black/40 backdrop-blur-sm border-cyan-500/50 p-4">
        <p className="text-cyan-400 text-sm animate-pulse">Checking balance...</p>
      </Card>
    );
  }

  if (result.hasSufficientBalance) {
    return (
      <Card className="hud-border-green bg-black/40 backdrop-blur-sm border-green-500/50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-400 font-bold text-sm mb-2">BALANCE SUFFICIENT</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Escrow Amount</span>
                <p className="text-cyan-400 font-mono">
                  {formatADA(result.requiredAmount)} ₳
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Estimated Fee</span>
                <p className="text-cyan-400 font-mono">
                  {formatADA(result.estimatedFee)} ₳
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Required</span>
                <p className="text-pink-400 font-mono">
                  {formatADA(result.totalRequired)} ₳
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Your Balance</span>
                <p className="text-green-400 font-mono">
                  {formatADA(result.userBalance)} ₳
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hud-border-red bg-black/40 backdrop-blur-sm border-red-500/50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-400 font-bold text-sm mb-2">INSUFFICIENT BALANCE</p>
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <span className="text-muted-foreground">Total Required</span>
              <p className="text-pink-400 font-mono">
                {formatADA(result.totalRequired)} ₳
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Your Balance</span>
              <p className="text-red-400 font-mono">
                {formatADA(result.userBalance)} ₳
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Shortfall</span>
              <p className="text-orange-400 font-mono">
                {formatADA(result.shortfall)} ₳ needed
              </p>
            </div>
          </div>
          <a
            href="https://docs.cardano.org/cardano-testnet/tools/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 text-xs underline"
          >
            Get test ADA from Cardano Faucet →
          </a>
        </div>
      </div>
    </Card>
  );
}
