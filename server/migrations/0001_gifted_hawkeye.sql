CREATE TABLE `player_badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`badge_id` text NOT NULL,
	`unlocked_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_player_badges` ON `player_badges` (`user_id`,`badge_id`);--> statement-breakpoint
CREATE TABLE `player_inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_player_inventory` ON `player_inventory` (`user_id`,`item_id`);