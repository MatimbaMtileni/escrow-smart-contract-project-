import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: escrows = [], isLoading } = trpc.escrow.getAllEscrows.useQuery();

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "released":
        return <CheckCircle className="w-4 h-4" />;
      case "refunded":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const formatDeadline = (deadlineMs: string) => {
    try {
      const ms = parseInt(deadlineMs, 10);
      const now = Date.now();
      const remaining = ms - now;

      if (remaining < 0) {
        return "Expired";
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        return `${days}d ${hours}h`;
      }
      return `${hours}h`;
    } catch {
      return "Invalid";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 scanlines">
      {/* Header */}
      <div className="border-b border-pink-500/30 bg-black/40 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold neon-glow-pink mb-2">ESCROW NEXUS</h1>
              <p className="text-cyan-400 text-sm tracking-widest">MULTI-SIGNATURE FUND MANAGEMENT PROTOCOL</p>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="btn-neon-cyan text-sm"
            >
              ← HOME
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect />
        </div>

        {/* Action Buttons */}
        <div className="mb-12 flex gap-4">
          <button
            onClick={() => setLocation("/lock")}
            className="btn-neon-pink"
          >
            ⚡ LOCK FUNDS
          </button>
          <button
            onClick={() => setLocation("/history")}
            className="btn-neon-cyan"
          >
            📜 TRANSACTION HISTORY
          </button>
        </div>

        {/* Escrows Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin">
                <div className="w-12 h-12 border-2 border-pink-500/50 border-t-pink-400 rounded-full"></div>
              </div>
              <p className="text-cyan-400 mt-4 tracking-widest">LOADING ESCROWS...</p>
            </div>
          </div>
        ) : escrows.length === 0 ? (
          <div className="text-center py-12 hud-border rounded p-8">
            <p className="text-muted-foreground text-lg mb-4">NO ESCROW CONTRACTS FOUND</p>
            <p className="text-sm text-muted-foreground">
              Create your first escrow to begin secure fund transfers
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {escrows.map((escrow) => (
              <Card
                key={escrow.contractId}
                className="hud-border bg-black/60 backdrop-blur-sm border-pink-500/50 hover:border-pink-400/80 transition-all cursor-pointer group"
                onClick={() => setLocation(`/escrow/${escrow.contractId}`)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-mono text-xs text-cyan-400 mb-2 truncate">
                        {escrow.contractId}
                      </h3>
                      <p className="text-pink-400 font-bold text-sm">
                        {escrow.amount} UNITS
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 ${getStatusColor(escrow.status)}`}>
                      {getStatusIcon(escrow.status)}
                      <span className="text-xs font-bold uppercase">{escrow.status}</span>
                    </div>
                  </div>

                  {/* Approval Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">APPROVALS</span>
                      <span className="text-cyan-400 font-bold">
                        {escrow.currentApprovals}/{escrow.requiredApprovals}
                      </span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2 border border-pink-500/30 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all duration-300"
                        style={{
                          width: `${(escrow.currentApprovals / escrow.requiredApprovals) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex justify-between items-center text-xs mb-4 pb-4 border-b border-pink-500/20">
                    <span className="text-muted-foreground">DEADLINE</span>
                    <span className="text-yellow-400 font-mono">
                      {formatDeadline(escrow.deadline)}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="text-xs text-muted-foreground">
                    Created: {formatDate(escrow.createdAt.toString())}
                  </div>

                  {/* Action Hint */}
                  <div className="mt-4 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    CLICK TO VIEW DETAILS →
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
