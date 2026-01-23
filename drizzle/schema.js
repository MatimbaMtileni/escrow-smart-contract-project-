import { int, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().onUpdateNow().notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Escrow Contracts Table
 * Stores all escrow agreements with their state and parameters
 */
export const escrowContracts = sqliteTable("escrow_contracts", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier for the escrow contract */
  contractId: text("contract_id").notNull().unique(),
  /** User ID of the depositor (fund locker) */
  depositorId: int("depositor_id").notNull(),
  /** User ID of the beneficiary (fund receiver) */
  beneficiaryId: int("beneficiary_id").notNull(),
  /** Amount locked in the escrow (in smallest unit, e.g., lovelace for Cardano) */
  amount: text("amount").notNull(),
  /** Number of approvals required before release */
  requiredApprovals: int("required_approvals").notNull(),
  /** Current number of approvals collected */
  currentApprovals: int("current_approvals").default(0).notNull(),
  /** Deadline timestamp (Unix milliseconds) */
  deadline: text("deadline").notNull(),
  /** Status of the escrow: pending, approved, released, refunded */
  status: text("status").default("pending").notNull(),
  /** Description or purpose of the escrow */
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().onUpdateNow().notNull(),
});

export type EscrowContract = typeof escrowContracts.$inferSelect;
export type InsertEscrowContract = typeof escrowContracts.$inferInsert;

/**
 * Escrow Officials Table
 * Maps officials to escrow contracts and tracks their approvals
 */
export const escrowOfficials = sqliteTable("escrow_officials", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the escrow contract */
  contractId: text("contract_id").notNull(),
  /** User ID of the official */
  officialId: int("official_id").notNull(),
  /** Whether this official has approved */
  hasApproved: int("has_approved").default(0).notNull(),
  /** Timestamp of approval (null if not approved) */
  approvalTimestamp: integer("approval_timestamp", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export type EscrowOfficial = typeof escrowOfficials.$inferSelect;
export type InsertEscrowOfficial = typeof escrowOfficials.$inferInsert;

/**
 * Transaction History Table
 * Logs all operations on escrow contracts for audit trail
 */
export const transactionHistory = sqliteTable("transaction_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the escrow contract */
  contractId: text("contract_id").notNull(),
  /** Type of transaction: lock, approve, release, refund */
  transactionType: text("transaction_type").notNull(),
  /** User ID who initiated the transaction */
  initiatedBy: int("initiated_by").notNull(),
  /** Additional details about the transaction */
  details: text("details"),
  /** Transaction hash or reference (if applicable) */
  txHash: text("tx_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export type TransactionHistory = typeof transactionHistory.$inferSelect;
export type InsertTransactionHistory = typeof transactionHistory.$inferInsert;