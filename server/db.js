import { eq, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { InsertUser, users, escrowContracts, escrowOfficials, transactionHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      const sqlite = new Database("./drizzle/db.sqlite");
      _db = drizzle(sqlite);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// ESCROW OPERATIONS
// ============================================================================

export async function getEscrowById(contractId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(escrowContracts)
    .where(eq(escrowContracts.contractId, contractId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserEscrows(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(escrowContracts)
    .where(
      or(
        eq(escrowContracts.depositorId, userId),
        eq(escrowContracts.beneficiaryId, userId)
      )
    );

  return result;
}

export async function getEscrowOfficials(contractId: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(escrowOfficials)
    .where(eq(escrowOfficials.contractId, contractId));

  return result;
}

export async function createEscrow(
  contractId: string,
  depositorId: number,
  beneficiaryId: number,
  amount: string,
  requiredApprovals: number,
  deadline: string,
  description?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(escrowContracts).values({
    contractId,
    depositorId,
    beneficiaryId,
    amount,
    requiredApprovals,
    currentApprovals: 0,
    deadline,
    status: 'pending',
    description,
  });
}

export async function addEscrowOfficials(
  contractId: string,
  officialIds: number[]
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const values = officialIds.map(id => ({
    contractId,
    officialId: id,
    hasApproved: 0,
  }));

  await db.insert(escrowOfficials).values(values);
}

export async function recordApproval(
  contractId: string,
  officialId: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(escrowOfficials)
    .set({
      hasApproved: 1,
      approvalTimestamp: new Date(),
    })
    .where(
      and(
        eq(escrowOfficials.contractId, contractId),
        eq(escrowOfficials.officialId, officialId)
      )
    );

  const officials = await getEscrowOfficials(contractId);
  const approvalCount = officials.filter(o => o.hasApproved === 1).length;

  await db
    .update(escrowContracts)
    .set({ currentApprovals: approvalCount })
    .where(eq(escrowContracts.contractId, contractId));
}

export async function updateEscrowStatus(
  contractId: string,
  status: 'pending' | 'approved' | 'released' | 'refunded'
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(escrowContracts)
    .set({ status })
    .where(eq(escrowContracts.contractId, contractId));
}

export async function recordTransaction(
  contractId: string,
  transactionType: 'lock' | 'approve' | 'release' | 'refund',
  initiatedBy: number,
  details?: string,
  txHash?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(transactionHistory).values({
    contractId,
    transactionType,
    initiatedBy,
    details,
    txHash,
  });
}

export async function getTransactionHistory(contractId: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactionHistory)
    .where(eq(transactionHistory.contractId, contractId))
    .orderBy(t => t.createdAt);

  return result;
}

export async function getAllEscrows() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(escrowContracts);
  return result;
}
