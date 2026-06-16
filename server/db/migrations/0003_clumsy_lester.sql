CREATE TABLE `delivery_evidences` (
	`id` text PRIMARY KEY NOT NULL,
	`stop_id` text NOT NULL,
	`photo_url` text,
	`signature_data` text,
	`recipient_name` text,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`stop_id`) REFERENCES `delivery_stops`(`id`) ON UPDATE no action ON DELETE cascade
);
