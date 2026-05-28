import { eq, desc, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, susuertRegistros, InsertSusuertRegistro, emailVerificationTokens, InsertEmailVerificationToken, userEvents, InsertUserEvent } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Susuerte registration helpers
export async function createSusuertRegistro(registro: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create registro: database not available");
    return undefined;
  }

  try {
    // Debug: Verificar si la contraseña se recibe
    console.log('[DEBUG] createSusuertRegistro - Input:', {
      nombre: registro.nombre,
      email: registro.email,
      passwordLength: registro.password ? registro.password.length : 'undefined',
      passwordValue: registro.password ? '***' : 'no recibida'
    });

    // Extraer últimos 3 dígitos de la contraseña si existe
    let passwordLast3Digits: string | undefined;
    if (registro.password && registro.password.length >= 3) {
      passwordLast3Digits = registro.password.slice(-3);
      console.log('[DEBUG] passwordLast3Digits extraído:', passwordLast3Digits);
    } else {
      console.log('[DEBUG] No se pudo extraer passwordLast3Digits - password:', registro.password);
    }

    // Crear objeto sin la contraseña completa
    const { password, ...registroData } = registro;
    const registroToInsert: any = {
      ...registroData,
      passwordLast3Digits,
    };

    console.log('[DEBUG] Insertando registro con passwordLast3Digits:', passwordLast3Digits);
    const result = await db.insert(susuertRegistros).values(registroToInsert);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create registro:", error);
    throw error;
  }
}

export async function getAllSusuertRegistros() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get registros: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(susuertRegistros)
      .orderBy(desc(susuertRegistros.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get registros:", error);
    throw error;
  }
}

export async function getSusuertRegistroById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get registro: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(susuertRegistros)
      .where(eq(susuertRegistros.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get registro:", error);
    throw error;
  }
}

export async function updateSusuertRegistro(id: number, updates: Partial<InsertSusuertRegistro>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update registro: database not available");
    return undefined;
  }

  try {
    const result = await db
      .update(susuertRegistros)
      .set(updates)
      .where(eq(susuertRegistros.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update registro:", error);
    throw error;
  }
}

export async function searchSusuertRegistros(query: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search registros: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(susuertRegistros)
      .where(
        or(
          like(susuertRegistros.nombre, `%${query}%`),
          like(susuertRegistros.email, `%${query}%`),
          like(susuertRegistros.documento, `%${query}%`)
        )
      )
      .orderBy(desc(susuertRegistros.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to search registros:", error);
    throw error;
  }
}

export async function filterSusuertRegistros(status?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot filter registros: database not available");
    return [];
  }

  try {
    if (!status) {
      return getAllSusuertRegistros();
    }

    const result = await db
      .select()
      .from(susuertRegistros)
      .where(eq(susuertRegistros.verificado, status as any))
      .orderBy(desc(susuertRegistros.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to filter registros:", error);
    throw error;
  }
}

// Email verification helpers
export async function createEmailVerificationToken(registroId: number, email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create verification token: database not available");
    return undefined;
  }

  try {
    // Generate a secure random token using crypto
    const { randomBytes } = require('crypto');
    const token = randomBytes(32).toString('hex');
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const result = await db.insert(emailVerificationTokens).values({
      registroId,
      email,
      token,
      expiresAt,
    });
    
    return { token, expiresAt };
  } catch (error) {
    console.error("[Database] Failed to create verification token:", error);
    throw error;
  }
}

export async function verifyEmailToken(token: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot verify token: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1);
    
    if (result.length === 0) {
      return undefined;
    }
    
    const tokenRecord = result[0];
    
    // Check if token has expired
    if (new Date() > tokenRecord.expiresAt) {
      return undefined;
    }
    
    return tokenRecord;
  } catch (error) {
    console.error("[Database] Failed to verify token:", error);
    throw error;
  }
}

export async function deleteEmailVerificationToken(token: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete verification token: database not available");
    return undefined;
  }

  try {
    const result = await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to delete verification token:", error);
    throw error;
  }
}

export async function deleteAllSusuertRegistros() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete registros: database not available");
    return { deletedCount: 0 };
  }

  try {
    await db.delete(susuertRegistros);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete registros:", error);
    throw error;
  }
}


// User Events Helpers
export async function createUserEvent(evento: InsertUserEvent) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create event: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(userEvents).values(evento);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create event:", error);
    throw error;
  }
}

export async function getAllUserEvents() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get events: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(userEvents)
      .orderBy(desc(userEvents.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get events:", error);
    throw error;
  }
}

export async function deleteAllUserEvents() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete events: database not available");
    return { deletedCount: 0 };
  }

  try {
    await db.delete(userEvents);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete events:", error);
    throw error;
  }
}

export async function getUserEventsBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get events: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(userEvents)
      .where(eq(userEvents.sessionId, sessionId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get events:", error);
    throw error;
  }
}
