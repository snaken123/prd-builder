import { neon } from "@neondatabase/serverless";
import type { PRDFormData, ProcessData } from "./types.js";

const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
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
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS submission_process (
          submission_id INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
          processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          role TEXT,
          role_other TEXT,
          goal_scope TEXT,
          goal_details TEXT,
          context_flags JSONB,
          context_other TEXT,
          expectation_flags JSONB,
          expectation_other TEXT
        )
      `;
    })();
  }
  return schemaReady;
}

export interface SubmissionRow extends PRDFormData {
  id: number;
  createdAt: string;
}

export interface SubmissionSummaryRow {
  id: number;
  createdAt: string;
  appName: string;
  tagline: string;
  platform: string;
  processed: boolean;
}

export interface ProcessRow extends ProcessData {
  submissionId: number;
  processedAt: string;
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

function toProcessRow(r: any): ProcessRow {
  return {
    submissionId: r.submission_id,
    processedAt: r.processed_at,
    role: r.role ?? "",
    roleOther: r.role_other ?? "",
    goalScope: r.goal_scope ?? "",
    goalDetails: r.goal_details ?? "",
    contextFlags: r.context_flags ?? [],
    contextOther: r.context_other ?? "",
    expectationFlags: r.expectation_flags ?? [],
    expectationOther: r.expectation_other ?? "",
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

export async function listSubmissions(): Promise<SubmissionSummaryRow[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT s.id, s.created_at, s.app_name, s.tagline, s.platform,
           (p.submission_id IS NOT NULL) AS processed
    FROM submissions s
    LEFT JOIN submission_process p ON p.submission_id = s.id
    ORDER BY s.created_at DESC
  `;
  return rows.map((r: any) => ({
    id: r.id,
    createdAt: r.created_at,
    appName: r.app_name,
    tagline: r.tagline ?? "",
    platform: r.platform ?? "",
    processed: r.processed,
  }));
}

export async function getSubmission(id: number): Promise<SubmissionRow | null> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM submissions WHERE id = ${id}`;
  if (rows.length === 0) return null;
  return toRow(rows[0]);
}

export async function upsertProcess(submissionId: number, data: ProcessData): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO submission_process (
      submission_id, role, role_other, goal_scope, goal_details,
      context_flags, context_other, expectation_flags, expectation_other, processed_at
    ) VALUES (
      ${submissionId}, ${data.role}, ${data.roleOther}, ${data.goalScope}, ${data.goalDetails},
      ${JSON.stringify(data.contextFlags)}, ${data.contextOther}, ${JSON.stringify(data.expectationFlags)}, ${data.expectationOther}, now()
    )
    ON CONFLICT (submission_id) DO UPDATE SET
      role = EXCLUDED.role,
      role_other = EXCLUDED.role_other,
      goal_scope = EXCLUDED.goal_scope,
      goal_details = EXCLUDED.goal_details,
      context_flags = EXCLUDED.context_flags,
      context_other = EXCLUDED.context_other,
      expectation_flags = EXCLUDED.expectation_flags,
      expectation_other = EXCLUDED.expectation_other,
      processed_at = now()
  `;
}

export async function getProcess(submissionId: number): Promise<ProcessRow | null> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM submission_process WHERE submission_id = ${submissionId}`;
  if (rows.length === 0) return null;
  return toProcessRow(rows[0]);
}
