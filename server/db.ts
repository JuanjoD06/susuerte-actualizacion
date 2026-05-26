import { eq, desc, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, susuertRegistros, InsertSusuertRegistro } from "../drizzle/schema";
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
export async function createSusuertRegistro(registro: InsertSusuertRegistro) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create registro: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(susuertRegistros).values(registro);
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
