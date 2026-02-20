-- Better Auth Schema
-- Better Auth will auto-create these tables, but we include the schema here for documentation

CREATE TABLE IF NOT EXISTS `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text,
  `email` text UNIQUE,
  `emailVerified` boolean,
  `image` text,
  `role` text DEFAULT 'member',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS `session` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `account` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `type` text NOT NULL,
  `provider` text NOT NULL,
  `providerAccountId` text NOT NULL,
  `accessToken` text,
  `refreshToken` text,
  `expiresAt` integer,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  UNIQUE(`provider`, `providerAccountId`)
);

CREATE TABLE IF NOT EXISTS `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp DEFAULT current_timestamp,
  `updatedAt` timestamp DEFAULT current_timestamp,
  UNIQUE(`identifier`, `value`)
);

CREATE INDEX IF NOT EXISTS `user_email_idx` ON `user`(`email`);
CREATE INDEX IF NOT EXISTS `session_userId_idx` ON `session`(`userId`);
CREATE INDEX IF NOT EXISTS `account_userId_idx` ON `account`(`userId`);
