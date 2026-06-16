CREATE TABLE `location_history` (
	`id` text PRIMARY KEY NOT NULL,
	`driver_id` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`accuracy` real,
	`speed` real,
	`heading` real,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `loc_hist_driver_recorded_idx` ON `location_history` (`driver_id`,`recorded_at`);--> statement-breakpoint
ALTER TABLE `delivery_stops` ADD `delivered_at` integer;--> statement-breakpoint
ALTER TABLE `delivery_stops` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `delivery_stops` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `delivery_stops` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `dispatch_zones` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `dispatch_zones` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `drivers` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `drivers` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `drivers_user_id_idx` ON `drivers` (`user_id`);--> statement-breakpoint
CREATE INDEX `drivers_status_idx` ON `drivers` (`status`);--> statement-breakpoint
ALTER TABLE `routes` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `routes` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `routes` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `routes_driver_idx` ON `routes` (`driver_id`);--> statement-breakpoint
CREATE INDEX `routes_date_idx` ON `routes` (`date`);