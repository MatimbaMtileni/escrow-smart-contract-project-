import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, Lock, CheckCircle, Send } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 scanlines overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-pink-500/30 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold neon-glow-pink">ESCROW NEXUS</h1>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-cyan-400 text-sm">Welcome, {user?.name || "User"}</span>
                <button
                  onClick={() => setLocation("/dashboard")}
                  className="btn-neon-cyan text-sm"
                >
                  DASHBOARD
                </button>
                <button
                  onClick={() => logout()}
                  className="btn-neon-pink text-sm"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <a href={getLoginUrl()} className="btn-neon-pink text-sm">
                LOGIN
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl font-bold neon-glow-pink mb-4 leading-tight">
              MULTI-SIGNATURE ESCROW
            </h2>
            <p className="text-2xl neon-glow-cyan mb-6">
              SECURE FUND TRANSFERS REQUIRING MULTIPLE APPROVALS
            </p>
          </div>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Experience the future of secure fund management. Lock funds, require official approvals, and execute transfers with cryptographic certainty. Built for trust, powered by smart contracts.
          </p>

          {isAuthenticated ? (
            <button
              onClick={() => setLocation("/dashboard")}
              className="btn-neon-pink text-lg"
            >
              ENTER SYSTEM <ArrowRight className="inline ml-2 w-5 h-5" />
            </button>
          ) : (
            <a href={getLoginUrl()} className="btn-neon-pink text-lg inline-block">
              INITIALIZE ACCESS <ArrowRight className="inline ml-2 w-5 h-5" />
            </a>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-24">
        <h3 className="text-3xl font-bold neon-glow-cyan mb-12 text-center">CORE FEATURES</h3>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lock Funds */}
          <div className="hud-border bg-black/60 backdrop-blur-sm border-pink-500/50 p-8 group hover:border-pink-400/80 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-pink-400" />
              <h4 className="text-lg font-bold neon-glow-pink">LOCK FUNDS</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Create escrow contracts with specified beneficiaries, officials, and approval thresholds.
            </p>
            <p className="text-xs text-cyan-400">n-of-m multisignature support</p>
          </div>

          {/* Approve */}
          <div className="hud-border bg-black/60 backdrop-blur-sm border-cyan-500/50 p-8 group hover:border-cyan-400/80 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-cyan-400" />
              <h4 className="text-lg font-bold neon-glow-cyan">APPROVE</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Officials sign off on escrow agreements. Each official can approve only once before deadline.
            </p>
            <p className="text-xs text-pink-400">Unique signature validation</p>
          </div>

          {/* Release/Refund */}
          <div className="hud-border bg-black/60 backdrop-blur-sm border-purple-500/50 p-8 group hover:border-purple-400/80 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-6 h-6 text-purple-400" />
              <h4 className="text-lg font-bold text-purple-400">RELEASE/REFUND</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Beneficiary claims funds with sufficient approvals. Depositor reclaims after deadline if insufficient.
            </p>
            <p className="text-xs text-cyan-400">Deadline-based logic</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-24">
        <h3 className="text-3xl font-bold neon-glow-pink mb-12 text-center">HOW IT WORKS</h3>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="hud-border-cyan bg-black/40 backdrop-blur-sm border-cyan-500/50 p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-500/50">
                  <span className="text-cyan-400 font-bold">1</span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-cyan-400 mb-2">DEPOSIT</h4>
                <p className="text-muted-foreground">Depositor locks funds into the escrow contract, specifying beneficiary and officials.</p>
              </div>
            </div>
          </div>

          <div className="hud-border-cyan bg-black/40 backdrop-blur-sm border-cyan-500/50 p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-pink-500/20 border border-pink-500/50">
                  <span className="text-pink-400 font-bold">2</span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-pink-400 mb-2">APPROVE</h4>
                <p className="text-muted-foreground">Officials review and approve the escrow. Required number of approvals must be collected before deadline.</p>
              </div>
            </div>
          </div>

          <div className="hud-border-cyan bg-black/40 backdrop-blur-sm border-cyan-500/50 p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-500/20 border border-green-500/50">
                  <span className="text-green-400 font-bold">3</span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-green-400 mb-2">RELEASE OR REFUND</h4>
                <p className="text-muted-foreground">Beneficiary claims funds if approvals meet threshold before deadline, or depositor reclaims after deadline if insufficient.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <div className="hud-border bg-gradient-to-br from-pink-500/10 to-cyan-500/10 backdrop-blur-sm border-pink-500/50 p-12 rounded">
          <h3 className="text-3xl font-bold neon-glow-pink mb-4">READY TO SECURE YOUR TRANSFERS?</h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join the next generation of escrow systems. Transparent, secure, and verifiable on-chain.
          </p>
          {isAuthenticated ? (
            <button
              onClick={() => setLocation("/dashboard")}
              className="btn-neon-pink text-lg"
            >
              LAUNCH DASHBOARD
            </button>
          ) : (
            <a href={getLoginUrl()} className="btn-neon-pink text-lg inline-block">
              GET STARTED NOW
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pink-500/30 bg-black/40 backdrop-blur-sm py-8 mt-24">
        <div className="container text-center">
          <p className="text-muted-foreground text-sm">
            ESCROW NEXUS © 2026 | Multi-Signature Fund Management Protocol
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Built with cryptographic precision. Secured by smart contracts.
          </p>
        </div>
      </footer>
    </div>
  );
}
