CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`model_id` text NOT NULL,
	`thread_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversations_thread_id_unique` ON `conversations` (`thread_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`content` text NOT NULL,
	`author` text NOT NULL,
	`from_discord` integer NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
