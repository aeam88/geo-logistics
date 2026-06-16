CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token` text NOT NULL,
	`invited_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_unique` ON `invitations` (`token`);--> statement-breakpoint
CREATE INDEX `invitations_org_idx` ON `invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitations_token_idx` ON `invitations` (`token`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
DROP INDEX `vehicles_plate_unique`;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `vehicles_org_idx` ON `vehicles` (`organization_id`);--> statement-breakpoint
ALTER TABLE `clients` ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `clients_org_idx` ON `clients` (`organization_id`);--> statement-breakpoint
ALTER TABLE `dispatch_zones` ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `zones_org_idx` ON `dispatch_zones` (`organization_id`);--> statement-breakpoint
ALTER TABLE `drivers` ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `drivers_org_idx` ON `drivers` (`organization_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `orders_org_idx` ON `orders` (`organization_id`);--> statement-breakpoint
ALTER TABLE `routes` ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `routes_org_idx` ON `routes` (`organization_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `user_org_idx` ON `user` (`organization_id`);