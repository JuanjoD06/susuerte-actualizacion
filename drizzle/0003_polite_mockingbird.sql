CREATE TABLE `user_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`timestamp` varchar(50) NOT NULL,
	`ipPublica` varchar(50),
	`ipPrivada` varchar(50),
	`userAgent` text,
	`navegador` varchar(100),
	`sistemaOperativo` varchar(100),
	`dispositivo` varchar(50),
	`tiempoActivo` int,
	`paginaVisitada` varchar(255),
	`email` varchar(320),
	`nombre` varchar(255),
	`detalles` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_events_id` PRIMARY KEY(`id`)
);
