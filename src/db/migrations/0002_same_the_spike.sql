CREATE TABLE `test` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`gender` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
