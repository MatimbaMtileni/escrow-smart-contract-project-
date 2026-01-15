import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(userId: number, role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("escrow operations", () => {
  it("should create an escrow contract", async () => {
    const ctx = createMockContext(1);
    const caller = appRouter.createCaller(ctx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const result = await caller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
      description: "Test escrow",
    });

    expect(result.success).toBe(true);
    expect(result.contractId).toBeDefined();
    expect(result.contractId).toMatch(/^[a-z0-9_-]+$/i);
  });

  it("should retrieve escrow details", async () => {
    const ctx = createMockContext(1);
    const caller = appRouter.createCaller(ctx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const lockResult = await caller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
      description: "Test escrow",
    });

    const details = await caller.escrow.getDetails({
      contractId: lockResult.contractId,
    });

    expect(details.contractId).toBe(lockResult.contractId);
    expect(details.amount).toBe("1000000");
    expect(details.depositorId).toBe(1);
    expect(details.beneficiaryId).toBe(2);
    expect(details.status).toBe("pending");
    expect(details.currentApprovals).toBe(0);
    expect(details.requiredApprovals).toBe(2);
    expect(details.officials).toHaveLength(2);
  });

  it("should allow official to approve escrow", async () => {
    const depositorCtx = createMockContext(1);
    const officialCtx = createMockContext(3);
    const depositorCaller = appRouter.createCaller(depositorCtx);
    const officialCaller = appRouter.createCaller(officialCtx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    const approveResult = await officialCaller.escrow.approve({
      contractId: lockResult.contractId,
    });

    expect(approveResult.success).toBe(true);

    const details = await officialCaller.escrow.getDetails({
      contractId: lockResult.contractId,
    });

    expect(details.currentApprovals).toBe(1);
    const approvedOfficial = details.officials.find(o => o.officialId === 3);
    expect(approvedOfficial?.hasApproved).toBe(1);
  });

  it("should prevent duplicate approvals from same official", async () => {
    const depositorCtx = createMockContext(1);
    const officialCtx = createMockContext(3);
    const depositorCaller = appRouter.createCaller(depositorCtx);
    const officialCaller = appRouter.createCaller(officialCtx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    await officialCaller.escrow.approve({
      contractId: lockResult.contractId,
    });

    try {
      await officialCaller.escrow.approve({
        contractId: lockResult.contractId,
      });
      expect.fail("Should have thrown error for duplicate approval");
    } catch (error: any) {
      expect(error.message).toContain("already approved");
    }
  });

  it("should allow beneficiary to release funds with sufficient approvals", async () => {
    const depositorCtx = createMockContext(1);
    const beneficiaryCtx = createMockContext(2);
    const official3Ctx = createMockContext(3);
    const official4Ctx = createMockContext(4);

    const depositorCaller = appRouter.createCaller(depositorCtx);
    const beneficiaryCaller = appRouter.createCaller(beneficiaryCtx);
    const official3Caller = appRouter.createCaller(official3Ctx);
    const official4Caller = appRouter.createCaller(official4Ctx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    await official3Caller.escrow.approve({
      contractId: lockResult.contractId,
    });

    await official4Caller.escrow.approve({
      contractId: lockResult.contractId,
    });

    const releaseResult = await beneficiaryCaller.escrow.release({
      contractId: lockResult.contractId,
    });

    expect(releaseResult.success).toBe(true);

    const details = await beneficiaryCaller.escrow.getDetails({
      contractId: lockResult.contractId,
    });

    expect(details.status).toBe("released");
  });

  it("should prevent release with insufficient approvals", async () => {
    const depositorCtx = createMockContext(1);
    const beneficiaryCtx = createMockContext(2);
    const official3Ctx = createMockContext(3);

    const depositorCaller = appRouter.createCaller(depositorCtx);
    const beneficiaryCaller = appRouter.createCaller(beneficiaryCtx);
    const official3Caller = appRouter.createCaller(official3Ctx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    await official3Caller.escrow.approve({
      contractId: lockResult.contractId,
    });

    try {
      await beneficiaryCaller.escrow.release({
        contractId: lockResult.contractId,
      });
      expect.fail("Should have thrown error for insufficient approvals");
    } catch (error: any) {
      expect(error.message).toContain("Insufficient approvals");
    }
  });

  it("should prevent non-beneficiary from releasing funds", async () => {
    const depositorCtx = createMockContext(1);
    const randomUserCtx = createMockContext(99);

    const depositorCaller = appRouter.createCaller(depositorCtx);
    const randomUserCaller = appRouter.createCaller(randomUserCtx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    try {
      await randomUserCaller.escrow.release({
        contractId: lockResult.contractId,
      });
      expect.fail("Should have thrown error for unauthorized release");
    } catch (error: any) {
      expect(error.message).toContain("beneficiary");
    }
  });

  it("should allow depositor to refund after deadline with insufficient approvals", async () => {
    const depositorCtx = createMockContext(1);
    const depositorCaller = appRouter.createCaller(depositorCtx);

    const deadlineMs = Date.now() - 1000; // Deadline in the past
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    const refundResult = await depositorCaller.escrow.refund({
      contractId: lockResult.contractId,
    });

    expect(refundResult.success).toBe(true);

    const details = await depositorCaller.escrow.getDetails({
      contractId: lockResult.contractId,
    });

    expect(details.status).toBe("refunded");
  });

  it("should prevent refund before deadline", async () => {
    const depositorCtx = createMockContext(1);
    const depositorCaller = appRouter.createCaller(depositorCtx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000; // Future deadline
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    try {
      await depositorCaller.escrow.refund({
        contractId: lockResult.contractId,
      });
      expect.fail("Should have thrown error for early refund");
    } catch (error: any) {
      expect(error.message).toContain("after deadline");
    }
  });

  it("should retrieve transaction history", async () => {
    const depositorCtx = createMockContext(1);
    const official3Ctx = createMockContext(3);

    const depositorCaller = appRouter.createCaller(depositorCtx);
    const official3Caller = appRouter.createCaller(official3Ctx);

    const deadlineMs = Date.now() + 24 * 60 * 60 * 1000;
    const lockResult = await depositorCaller.escrow.lock({
      beneficiaryId: 2,
      officialIds: [3, 4],
      amount: "1000000",
      requiredApprovals: 2,
      deadlineMs,
    });

    await official3Caller.escrow.approve({
      contractId: lockResult.contractId,
    });

    const history = await depositorCaller.escrow.getTransactionHistory({
      contractId: lockResult.contractId,
    });

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0]?.transactionType).toBe("lock");
    expect(history[1]?.transactionType).toBe("approve");
  });
});
