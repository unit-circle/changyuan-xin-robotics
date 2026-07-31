ALTER TABLE `access_codes` ADD `grant_mode` text DEFAULT 'scope' NOT NULL;
--> statement-breakpoint
ALTER TABLE `access_codes` ADD `session_hours` integer DEFAULT 24 NOT NULL;
--> statement-breakpoint
ALTER TABLE `access_codes` ADD `last_used_at` text;
--> statement-breakpoint
CREATE TABLE `access_code_files` (
	`access_code_id` integer NOT NULL,
	`file_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`access_code_id`) REFERENCES `access_codes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_code_files_pair_idx` ON `access_code_files` (`access_code_id`,`file_id`);
--> statement-breakpoint
CREATE INDEX `access_code_files_file_idx` ON `access_code_files` (`file_id`);
--> statement-breakpoint
CREATE TABLE `private_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`access_code_id` integer NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`access_code_id`) REFERENCES `access_codes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `private_sessions_access_code_idx` ON `private_sessions` (`access_code_id`,`expires_at`);
--> statement-breakpoint
ALTER TABLE `access_logs` ADD `file_id` integer REFERENCES `files`(`id`);
--> statement-breakpoint
ALTER TABLE `access_logs` ADD `ip_hash` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `access_logs` ADD `user_agent` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `access_logs` ADD `detail` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE INDEX `access_logs_code_time_idx` ON `access_logs` (`access_code_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `access_logs_ip_time_idx` ON `access_logs` (`ip_hash`,`created_at`);
