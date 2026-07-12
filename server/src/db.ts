import { neon } from "@neondatabase/serverless";
import type { PRDFormData } from "./types.js";

const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        app_name TEXT NOT NULL,
        tagline TEXT,
        problem TEXT,
        audience JSONB,
        audience_other TEXT,
        platform TEXT,
        features JSONB,
        features_other TEXT,
        must_have TEXT,
        nice_to_have TEXT,
        user_roles TEXT,
        roles_description TEXT,
        notes TEXT
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

export interface SubmissionRow extends PRDFormData {
  id: number;
  createdAt: string;
}

function toRow(r: any): SubmissionRow {
  return {
    id: r.id,
    createdAt: r.created_at,
    appName: r.app_name,
    tagline: r.tagline ?? "",
    problem: r.problem ?? "",
    audience: r.audience ?? [],
    audienceOther: r.audience_other ?? "",
    platform: r.platform ?? "",
    features: r.features ?? [],
    featuresOther: r.features_other ?? "",
    mustHave: r.must_have ?? "",
    niceToHave: r.nice_to_have ?? "",
    userRoles: r.user_roles ?? "",
    rolesDescription: r.roles_description ?? "",
    notes: r.notes ?? "",
  };
}

export async function insertSubmission(data: PRDFormData): Promise<number> {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO submissions (
      app_name, tagline, problem, audience, audience_other, platform,
      features, features_other, must_have, nice_to_have, user_roles,
      roles_description, notes
    ) VALUES (
      ${data.appName}, ${data.tagline}, ${data.problem}, ${JSON.stringify(data.audience)}, ${data.audienceOther}, ${data.platform},
      ${JSON.stringify(data.features)}, ${data.featuresOther}, ${data.mustHave}, ${data.niceToHave}, ${data.userRoles},
      ${data.rolesDescription}, ${data.notes}
    )
    RETURNING id
  `;
  return rows[0].id;
}

export async function listSubmissions(): Promise<Pick<SubmissionRow, "id" | "createdAt" | "appName" | "tagline" | "platform">[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT id, created_at, app_name, tagline, platform
    FROM submissions
    ORDER BY created_at DESC
  `;
  return rows.map((r: any) => ({
    id: r.id,
    createdAt: r.created_at,
    appName: r.app_name,
    tagline: r.tagline ?? "",
    platform: r.platform ?? "",
  }));
}

export async function getSubmission(id: number): Promise<SubmissionRow | null> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM submissions WHERE id = ${id}`;
  if (rows.length === 0) return null;
  return toRow(rows[0]);
}
