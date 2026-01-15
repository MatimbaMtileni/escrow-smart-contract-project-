import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  getEscrowById,
  getUserEscrows,
  getEscrowOfficials,
  createEscrow,
  addEscrowOfficials,
  recordApproval,
  updateEscrowStatus,
  recordTransaction,
  getTransactionHistory,
  getAllEscrows,
  getDb,
} from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // ESCROW OPERATIONS
  // ============================================================================

  escrow: router({
    /**
     * Lock funds: Create a new escrow contract
     */
    lock: protectedProcedure
      .input(
        z.object({
          beneficiaryId: z.number(),
          officialIds: z.array(z.number()).min(1),
          amount: z.string(),
          requiredApprovals: z.number().min(1),
          deadlineMs: z.number(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const contractId = nanoid();
          const now = Date.now();

          await createEscrow(
            contractId,
            ctx.user.id,
            input.beneficiaryId,
            input.amount,
            input.requiredApprovals,
            input.deadlineMs.toString(),
            input.description
          );

          await addEscrowOfficials(contractId, input.officialIds);

          await recordTransaction(
            contractId,
            "lock",
            ctx.user.id,
            `Depositor locked ${input.amount} ADA`
          );

          return { success: true, contractId };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Lock error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to lock funds",
          });
        }
      }),

    /**
     * Approve: Official approves the escrow
     */
    approve: protectedProcedure
      .input(
        z.object({
          contractId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const escrow = await getEscrowById(input.contractId);
          if (!escrow) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Escrow contract not found",
            });
          }

          const officials = await getEscrowOfficials(input.contractId);
          const isOfficial = officials.some(o => o.officialId === ctx.user.id);

          if (!isOfficial) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Only officials can approve this escrow",
            });
          }

          const hasApproved = officials.some(
            o => o.officialId === ctx.user.id && o.hasApproved === 1
          );

          if (hasApproved) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "You have already approved this escrow",
            });
          }

          await recordApproval(input.contractId, ctx.user.id);

          const updatedOfficials = await getEscrowOfficials(input.contractId);
          const approvalCount = updatedOfficials.filter(o => o.hasApproved === 1).length;

          await recordTransaction(
            input.contractId,
            "approve",
            ctx.user.id,
            `Official approved (${approvalCount}/${escrow.requiredApprovals})`
          );

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Approve error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to approve escrow",
          });
        }
      }),

    /**
     * Release: Beneficiary claims funds
     */
    release: protectedProcedure
      .input(
        z.object({
          contractId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const escrow = await getEscrowById(input.contractId);
          if (!escrow) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Escrow contract not found",
            });
          }

          if (escrow.beneficiaryId !== ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Only the beneficiary can release funds",
            });
          }

          if (escrow.status !== "pending") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Escrow is ${escrow.status}`,
            });
          }

          const now = Date.now();
          const deadline = parseInt(escrow.deadline, 10);
          if (now > deadline) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Release deadline has passed",
            });
          }

          if (escrow.currentApprovals < escrow.requiredApprovals) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient approvals: ${escrow.currentApprovals}/${escrow.requiredApprovals}`,
            });
          }

          await updateEscrowStatus(input.contractId, "released");

          await recordTransaction(
            input.contractId,
            "release",
            ctx.user.id,
            `Beneficiary released funds`
          );

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Release error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to release funds",
          });
        }
      }),

    /**
     * Refund: Depositor reclaims funds after deadline
     */
    refund: protectedProcedure
      .input(
        z.object({
          contractId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const escrow = await getEscrowById(input.contractId);
          if (!escrow) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Escrow contract not found",
            });
          }

          if (escrow.depositorId !== ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Only the depositor can refund",
            });
          }

          if (escrow.status !== "pending") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Escrow is ${escrow.status}`,
            });
          }

          const now = Date.now();
          const deadline = parseInt(escrow.deadline, 10);
          if (now < deadline) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot refund: deadline has not passed yet, refund only allowed after deadline",
            });
          }

          if (escrow.currentApprovals >= escrow.requiredApprovals) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot refund: sufficient approvals received",
            });
          }

          await updateEscrowStatus(input.contractId, "refunded");

          await recordTransaction(
            input.contractId,
            "refund",
            ctx.user.id,
            `Depositor refunded funds after deadline`
          );

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Refund error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to refund funds",
          });
        }
      }),

    /**
     * Get escrow details
     */
    getDetails: publicProcedure
      .input(z.object({ contractId: z.string() }))
      .query(async ({ input }) => {
        const escrow = await getEscrowById(input.contractId);
        if (!escrow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Escrow contract not found",
          });
        }

        const officials = await getEscrowOfficials(input.contractId);
        return {
          ...escrow,
          officials,
        };
      }),

    /**
     * Get user's escrows
     */
    getUserEscrows: protectedProcedure.query(async ({ ctx }) => {
      const escrows = await getUserEscrows(ctx.user.id);
      return escrows;
    }),

    /**
     * Get all escrows (for dashboard)
     */
    getAllEscrows: publicProcedure.query(async () => {
      const escrows = await getAllEscrows();
      return escrows;
    }),

    /**
     * Get transaction history for an escrow
     */
    getTransactionHistory: publicProcedure
      .input(z.object({ contractId: z.string() }))
      .query(async ({ input }) => {
        const transactions = await getTransactionHistory(input.contractId);
        return transactions;
      }),

    /**
     * Build lock transaction for blockchain submission
     */
    buildLockTx: protectedProcedure
      .input(
        z.object({
          beneficiaryId: z.number(),
          officialIds: z.array(z.number()),
          amount: z.string(),
          requiredApprovals: z.number(),
          deadlineMs: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const mockTxHex = `0x${Math.random().toString(16).slice(2)}`;
          return { txHex: mockTxHex };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to build transaction",
          });
        }
      }),

    /**
     * Check transaction status on blockchain via Blockfrost
     */
    checkTxStatus: publicProcedure
      .input(z.object({ txHash: z.string() }))
      .query(async ({ input }) => {
        try {
          const { getTransactionStatus } = await import("./cardano/blockfrost");
          const status = await getTransactionStatus(input.txHash);
          return status;
        } catch (error) {
          console.error("Blockfrost query failed:", error);
          return {
            status: "pending" as const,
            confirmations: 0,
            blockHeight: null,
            timestamp: null,
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
