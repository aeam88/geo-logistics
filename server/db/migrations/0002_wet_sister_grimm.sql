CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`contact_phone` text,
	`tax_id` text,
	`email` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text,
	`route_id` text,
	`reference_code` text,
	`items_count` integer DEFAULT 1,
	`weight_kg` real,
	`priority` text DEFAULT 'normal',
	`notes` text,
	`delivery_address` text NOT NULL,
	`delivery_lat` real,
	`delivery_lng` real,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `orders_client_idx` ON `orders` (`client_id`);--> statement-breakpoint
CREATE INDEX `orders_route_idx` ON `orders` (`route_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`plate` text NOT NULL,
	`type` text DEFAULT 'furgon',
	`capacity_kg` real,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);--> statement-breakpoint
ALTER TABLE `delivery_stops` ADD `order_id` text REFERENCES orders(id);--> statement-breakpoint
CREATE INDEX `stops_order_idx` ON `delivery_stops` (`order_id`);--> statement-breakpoint
ALTER TABLE `drivers` ADD `vehicle_id` text REFERENCES vehicles(id);--> statement-breakpoint
CREATE INDEX `drivers_vehicle_id_idx` ON `drivers` (`vehicle_id`);