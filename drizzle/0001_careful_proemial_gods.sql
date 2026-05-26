CREATE TABLE `susuert_registros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`telefono` varchar(20),
	`documento` varchar(50) NOT NULL,
	`verificado` enum('pendiente','verificado','rechazado') NOT NULL DEFAULT 'pendiente',
	`deviceType` varchar(50),
	`browser` varchar(100),
	`os` varchar(100),
	`sessionId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `susuert_registros_id` PRIMARY KEY(`id`)
);
