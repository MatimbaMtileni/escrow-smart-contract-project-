import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Escrow Contracts Table
 * Stores all escrow agreements with their state and parameters
 */
export const escrowContracts = mysqlTable("escrow_contracts", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier for the escrow contract */
  contractId: varchar("contract_id", { length: 64 }).notNull().unique(),
  /** User ID of the depositor (fund locker) */
  depositorId: int("depositor_id").notNull(),
  /** User ID of the beneficiary (fund receiver) */
  beneficiaryId: int("beneficiary_id").notNull(),
  /** Amount locked in the escrow (in smallest unit, e.g., lovelace for Cardano) */
  amount: varchar("amount", { length: 64 }).notNull(),
  /** Number of approvals required before release */
  requiredApprovals: int("required_approvals").notNull(),
  /** Current number of approvals collected */
  currentApprovals: int("current_approvals").default(0).notNull(),
  /** Deadline timestamp (Unix milliseconds) */
  deadline: varchar("deadline", { length: 64 }).notNull(),
  /** Status of the escrow: pending, approved, released, refunded */
  status: mysqlEnum("status", ["pending", "approved", "released", "refunded"]).default("pending").notNull(),
  /** Description or purpose of the escrow */
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EscrowContract = typeof escrowContracts.$inferSelect;
export type InsertEscrowContract = typeof escrowContracts.$inferInsert;

/**
 * Escrow Officials Table
 * Maps officials to escrow contracts and tracks their approvals
 */
export const escrowOfficials = mysqlTable("escrow_officials", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the escrow contract */
  contractId: varchar("contract_id", { length: 64 }).notNull(),
  /** User ID of the official */
  officialId: int("official_id").notNull(),
  /** Whether this official has approved */
  hasApproved: int("has_approved").default(0).notNull(),
  /** Timestamp of approval (null if not approved) */
  approvalTimestamp: timestamp("approval_timestamp"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EscrowOfficial = typeof escrowOfficials.$inferSelect;
export type InsertEscrowOfficial = typeof escrowOfficials.$inferInsert;

/**
 * Transaction History Table
 * Logs all operations on escrow contracts for audit trail
 */
export const transactionHistory = mysqlTable("transaction_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the escrow contract */
  contractId: varchar("contract_id", { length: 64 }).notNull(),
  /** Type of transaction: lock, approve, release, refund */
  transactionType: mysqlEnum("transaction_type", ["lock", "approve", "release", "refund"]).notNull(),
  /** User ID who initiated the transaction */
  initiatedBy: int("initiated_by").notNull(),
  /** Additional details about the transaction */
  details: text("details"),
  /** Transaction hash or reference (if applicable) */
  txHash: varchar("tx_hash", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TransactionHistory = typeof transactionHistory.$inferSelect;
export type InsertTransactionHistory = typeof transactionHistory.$inferInsert;