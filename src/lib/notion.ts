import { Client } from "@notionhq/client";
import bcrypt from "bcryptjs";

const notion = new Client({
  auth: process.env.NOTION_API_KEY!,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotionUser {
  id: string; // Notion page ID
  name: string;
  email: string;
  passwordHash: string;
  quotasRemaining: number;
  turnsUsed: number;
  createdAt: string;
}

// ─── Database helpers ─────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<NotionUser | null> {
  try {
    const response = await (notion.databases as any).query({
      database_id: DATABASE_ID,
      filter: {
        property: "Email",
        email: { equals: email },
      },
    });

    if (response.results.length === 0) return null;

    const page = response.results[0];
    const props = page.properties;

    return {
      id: page.id,
      name: props.Name?.title?.[0]?.plain_text || "",
      email: props.Email?.email || "",
      passwordHash: props.SessionID?.rich_text?.[0]?.plain_text || "",
      quotasRemaining: props.QuotasRemaining?.number ?? 0,
      turnsUsed: props.TurnsUsed?.number ?? 0,
      createdAt: props.CreatedAt?.date?.start || page.created_time,
    };
  } catch {
    return null;
  }
}

export async function createUser(params: {
  name: string;
  email: string;
  passwordHash: string;
  brandUrl?: string;
  phone?: string;
}): Promise<NotionUser> {
  const existing = await findUserByEmail(params.email);
  if (existing) throw new Error("USER_EXISTS");

  const properties: any = {
    Name: { title: [{ text: { content: params.name } }] },
    Email: { email: params.email },
    SessionID: { rich_text: [{ text: { content: params.passwordHash } }] },
    QuotasRemaining: { number: 100 },
    TurnsUsed: { number: 0 },
    CreatedAt: { date: { start: new Date().toISOString() } },
  };

  if (params.brandUrl) {
    properties.BrandUrl = { url: params.brandUrl };
  }
  if (params.phone) {
    properties.Phone = { rich_text: [{ text: { content: params.phone } }] };
  }

  const page = await (notion.pages as any).create({
    parent: { database_id: DATABASE_ID },
    properties,
  });

  return {
    id: page.id,
    name: params.name,
    email: params.email,
    passwordHash: params.passwordHash,
    quotasRemaining: 100,
    turnsUsed: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<NotionUser | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) return null;

  try {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  } catch {
    return null;
  }
}

export async function deductQuota(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  if (!user) return false;
  if (user.quotasRemaining <= 0) return false;

  try {
    await (notion.pages as any).update({
      page_id: user.id,
      properties: {
        QuotasRemaining: { number: user.quotasRemaining - 1 },
        TurnsUsed: { number: user.turnsUsed + 1 },
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function addQuota(email: string, amount: number): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) return;

  try {
    await (notion.pages as any).update({
      page_id: user.id,
      properties: {
        QuotasRemaining: { number: user.quotasRemaining + amount },
      },
    });
  } catch {}
}

export async function getUserQuotas(email: string): Promise<{
  quotasRemaining: number;
  turnsUsed: number;
} | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return {
    quotasRemaining: user.quotasRemaining,
    turnsUsed: user.turnsUsed,
  };
}

// ─── API Key helpers (separate Notion database) ──────────────────────────────

const KEYS_DATABASE_ID = process.env.NOTION_KEYS_DATABASE_ID!;

export interface NotionApiKey {
  id: string; // Notion page ID
  email: string;
  provider: string; // "openrouter" | "minimax"
  key: string;
  enabled: boolean;
  createdAt: string;
}

/**
 * Get all API keys for a user by email.
 */
export async function getUserKeys(email: string): Promise<NotionApiKey[]> {
  try {
    const response = await (notion.databases as any).query({
      database_id: KEYS_DATABASE_ID,
      filter: {
        property: "Email",
        email: { equals: email },
      },
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        email: props.Email?.email || "",
        provider: props.Provider?.select?.name || "",
        key: props.Key?.rich_text?.[0]?.plain_text || "",
        enabled: props.Enabled?.checkbox ?? true,
        createdAt: props.CreatedAt?.date?.start || page.created_time,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Save (upsert) an API key for a user.
 * If a key already exists for this email+provider, update it; otherwise create a new one.
 */
export async function saveUserKey(
  email: string,
  provider: string,
  key: string
): Promise<NotionApiKey> {
  // Try to find existing key for this email+provider
  try {
    const existing = await (notion.databases as any).query({
      database_id: KEYS_DATABASE_ID,
      filter: {
        and: [
          { property: "Email", email: { equals: email } },
          { property: "Provider", select: { equals: provider } },
        ],
      },
    });

    if (existing.results.length > 0) {
      // Update existing
      const page = await (notion.pages as any).update({
        page_id: existing.results[0].id,
        properties: {
          Key: { rich_text: [{ text: { content: key } }] },
          Enabled: { checkbox: true },
        },
      });

      const props = page.properties;
      return {
        id: page.id,
        email: props.Email?.email || email,
        provider: props.Provider?.select?.name || provider,
        key,
        enabled: true,
        createdAt: props.CreatedAt?.date?.start || page.created_time,
      };
    }
  } catch {
    // Fall through to create
  }

  // Create new
  const page = await (notion.pages as any).create({
    parent: { database_id: KEYS_DATABASE_ID },
    properties: {
      Email: { email: email },
      Provider: { select: { name: provider } },
      Key: { rich_text: [{ text: { content: key } }] },
      Enabled: { checkbox: true },
      CreatedAt: { date: { start: new Date().toISOString() } },
    },
  });

  return {
    id: page.id,
    email,
    provider,
    key,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Delete an API key for a user by email and provider.
 */
export async function deleteUserKey(
  email: string,
  provider: string
): Promise<boolean> {
  try {
    const existing = await (notion.databases as any).query({
      database_id: KEYS_DATABASE_ID,
      filter: {
        and: [
          { property: "Email", email: { equals: email } },
          { property: "Provider", select: { equals: provider } },
        ],
      },
    });

    if (existing.results.length === 0) return false;

    await notion.pages.update({
      page_id: existing.results[0].id,
      archived: true,
    });
    return true;
  } catch {
    return false;
  }
}

export { notion };
