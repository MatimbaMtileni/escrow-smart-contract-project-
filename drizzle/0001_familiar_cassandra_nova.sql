CREATE TABLE `escrow_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contract_id` varchar(64) NOT NULL,
	`depositor_id` int NOT NULL,
	`beneficiary_id` int NOT NULL,
	`amount` varchar(64) NOT NULL,
	`required_approvals` int NOT NULL,
	`current_approvals` int NOT NULL DEFAULT 0,
	`deadline` varchar(64) NOT NULL,
	`status` enum('pending','approved','released','refunded') NOT NULL DEFAULT 'pending',
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `escrow_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `escrow_contracts_contract_id_unique` UNIQUE(`contract_id`)
);
--> statement-breakpoint
CREATE TABLE `escrow_officials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contract_id` varchar(64) NOT NULL,
	`official_id` int NOT NULL,
	`has_approved` int NOT NULL DEFAULT 0,
	`approval_timestamp` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escrow_officials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contract_id` varchar(64) NOT NULL,
	`transaction_type` enum('lock','approve','release','refund') NOT NULL,
	`initiated_by` int NOT NULL,
	`details` text,
	`tx_hash` varchar(256),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_history_id` PRIMARY KEY(`id`)
);
