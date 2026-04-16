CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`type` enum('llamada','reunion','visita','email') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` datetime NOT NULL,
	`endTime` datetime,
	`leadId` int,
	`contactId` int,
	`opportunityId` int,
	`assignedTo` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`oldValues` json,
	`newValues` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`website` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`zipCode` varchar(20),
	`industry` varchar(100),
	`employees` int,
	`annualRevenue` decimal(15,2),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`type` enum('llamada','email','reunion','nota') NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`content` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`mobile` varchar(20),
	`jobTitle` varchar(255),
	`department` varchar(100),
	`reportingTo` int,
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`zipCode` varchar(20),
	`birthDate` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`fieldType` enum('text','number','date','select','checkbox') NOT NULL,
	`options` json,
	`isRequired` boolean DEFAULT false,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`targetAmount` decimal(15,2) NOT NULL,
	`period` enum('mensual','trimestral','anual') NOT NULL,
	`assignedTo` int,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`type` enum('llamada','email','reunion','nota') NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`content` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`tag` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`company` varchar(255),
	`jobTitle` varchar(255),
	`source` varchar(255),
	`sourceId` int,
	`status` enum('nuevo','contactado','calificado','descartado') DEFAULT 'nuevo',
	`score` int DEFAULT 0,
	`assignedTo` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`leadId` int,
	`contactId` int,
	`companyId` int,
	`pipelineId` int NOT NULL,
	`stageId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`amount` decimal(15,2),
	`probability` int DEFAULT 0,
	`expectedCloseDate` datetime,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`type` enum('llamada','email','reunion','nota') NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunity_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`field` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`changedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunity_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`content` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunity_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`logo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `pipelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pipelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`price` decimal(15,2) NOT NULL,
	`cost` decimal(15,2),
	`sku` varchar(100),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quotationId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`details` text,
	`changedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quotation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotation_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quotationId` int NOT NULL,
	`productId` int,
	`description` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(15,2) NOT NULL,
	`discount` decimal(5,2) DEFAULT '0',
	`total` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quotation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`number` varchar(50) NOT NULL,
	`opportunityId` int,
	`contactId` int,
	`companyId` int,
	`status` enum('borrador','enviada','aceptada','rechazada') DEFAULT 'borrador',
	`subtotal` decimal(15,2) DEFAULT '0',
	`tax` decimal(15,2) DEFAULT '0',
	`total` decimal(15,2) DEFAULT '0',
	`validUntil` datetime,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotations_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotations_number_unique` UNIQUE(`number`),
	CONSTRAINT `quote_number_idx` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pipelineId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int NOT NULL,
	`color` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`reminderTime` datetime NOT NULL,
	`sent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pendiente','en_progreso','completada') DEFAULT 'pendiente',
	`priority` enum('baja','media','alta') DEFAULT 'media',
	`dueDate` datetime,
	`assignedTo` int,
	`leadId` int,
	`contactId` int,
	`opportunityId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`leaderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `organizationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `openId_idx` UNIQUE(`openId`);--> statement-breakpoint
CREATE INDEX `activity_org_idx` ON `activities` (`organizationId`);--> statement-breakpoint
CREATE INDEX `activity_assigned_idx` ON `activities` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `activity_start_idx` ON `activities` (`startTime`);--> statement-breakpoint
CREATE INDEX `audit_org_idx` ON `audit_logs` (`organizationId`);--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `company_org_idx` ON `companies` (`organizationId`);--> statement-breakpoint
CREATE INDEX `company_email_idx` ON `companies` (`email`);--> statement-breakpoint
CREATE INDEX `contact_activity_idx` ON `contact_activities` (`contactId`);--> statement-breakpoint
CREATE INDEX `contact_note_idx` ON `contact_notes` (`contactId`);--> statement-breakpoint
CREATE INDEX `contact_org_idx` ON `contacts` (`organizationId`);--> statement-breakpoint
CREATE INDEX `contact_company_idx` ON `contacts` (`companyId`);--> statement-breakpoint
CREATE INDEX `contact_email_idx` ON `contacts` (`email`);--> statement-breakpoint
CREATE INDEX `custom_org_idx` ON `custom_fields` (`organizationId`);--> statement-breakpoint
CREATE INDEX `goal_org_idx` ON `goals` (`organizationId`);--> statement-breakpoint
CREATE INDEX `goal_assigned_idx` ON `goals` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `activity_lead_idx` ON `lead_activities` (`leadId`);--> statement-breakpoint
CREATE INDEX `note_lead_idx` ON `lead_notes` (`leadId`);--> statement-breakpoint
CREATE INDEX `source_org_idx` ON `lead_sources` (`organizationId`);--> statement-breakpoint
CREATE INDEX `tag_lead_idx` ON `lead_tags` (`leadId`);--> statement-breakpoint
CREATE INDEX `lead_org_idx` ON `leads` (`organizationId`);--> statement-breakpoint
CREATE INDEX `lead_assigned_idx` ON `leads` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `lead_email_idx` ON `leads` (`email`);--> statement-breakpoint
CREATE INDEX `lead_source_idx` ON `leads` (`sourceId`);--> statement-breakpoint
CREATE INDEX `opp_org_idx` ON `opportunities` (`organizationId`);--> statement-breakpoint
CREATE INDEX `opp_stage_idx` ON `opportunities` (`stageId`);--> statement-breakpoint
CREATE INDEX `opp_assigned_idx` ON `opportunities` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `opp_lead_idx` ON `opportunities` (`leadId`);--> statement-breakpoint
CREATE INDEX `opp_contact_idx` ON `opportunities` (`contactId`);--> statement-breakpoint
CREATE INDEX `opp_activity_idx` ON `opportunity_activities` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `history_opp_idx` ON `opportunity_history` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `opp_note_idx` ON `opportunity_notes` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `pipeline_org_idx` ON `pipelines` (`organizationId`);--> statement-breakpoint
CREATE INDEX `product_org_idx` ON `products` (`organizationId`);--> statement-breakpoint
CREATE INDEX `product_sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `history_quote_idx` ON `quotation_history` (`quotationId`);--> statement-breakpoint
CREATE INDEX `item_quote_idx` ON `quotation_items` (`quotationId`);--> statement-breakpoint
CREATE INDEX `quote_org_idx` ON `quotations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `quote_opp_idx` ON `quotations` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `stage_pipeline_idx` ON `stages` (`pipelineId`);--> statement-breakpoint
CREATE INDEX `reminder_task_idx` ON `task_reminders` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_org_idx` ON `tasks` (`organizationId`);--> statement-breakpoint
CREATE INDEX `task_assigned_idx` ON `tasks` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `task_opp_idx` ON `tasks` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `team_idx` ON `team_members` (`teamId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `team_org_idx` ON `teams` (`organizationId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `users` (`organizationId`);