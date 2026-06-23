CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_achievements` ON `achievements` (`user_id`,`achievement_id`);--> statement-breakpoint
CREATE TABLE `action_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`details` text DEFAULT '',
	`created_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`username` text DEFAULT '',
	`first_name` text DEFAULT '',
	`text` text NOT NULL,
	`created_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `game_saves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`save_data` text NOT NULL,
	`updated_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_saves_user_id_unique` ON `game_saves` (`user_id`);--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`badges_count` integer DEFAULT 0,
	`team_level_sum` integer DEFAULT 0,
	`money` integer DEFAULT 0,
	`pokemon_count` integer DEFAULT 0,
	`legendary_count` integer DEFAULT 0,
	`updated_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboard_user_id_unique` ON `leaderboard` (`user_id`);--> statement-breakpoint
CREATE TABLE `player_quests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`quest_id` text NOT NULL,
	`progress` integer DEFAULT 0,
	`completed` integer DEFAULT 0,
	`claimed` integer DEFAULT 0,
	`created_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_player_quests` ON `player_quests` (`user_id`,`quest_id`);--> statement-breakpoint
CREATE TABLE `pokeapi_cache` (
	`url` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`cached_at` text DEFAULT 'datetime(''now'')'
);
--> statement-breakpoint
CREATE TABLE `pvp_ratings` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`rating` integer DEFAULT 1000,
	`wins` integer DEFAULT 0,
	`losses` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `save_backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`save_data` text NOT NULL,
	`saved_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`location_id` text NOT NULL,
	`updated_at` text DEFAULT 'datetime(''now'')',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_locations_user_id_unique` ON `user_locations` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` text NOT NULL,
	`username` text DEFAULT '',
	`first_name` text DEFAULT '',
	`nickname` text DEFAULT '',
	`avatar` text DEFAULT '👤',
	`starter_pokemon` text DEFAULT '',
	`registered` integer DEFAULT 0,
	`created_at` text DEFAULT 'datetime(''now'')',
	`registered_at` text DEFAULT ''
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);