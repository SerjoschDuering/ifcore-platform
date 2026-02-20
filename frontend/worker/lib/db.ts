export async function insertProject(db: D1Database, p: {
  id: string; name: string; file_url: string; user_id?: string | null;
  ifc_schema?: string | null; region?: string | null;
  building_type?: string | null; metadata?: string | null;
}) {
  return db.prepare(
    "INSERT INTO projects (id, name, file_url, user_id, ifc_schema, region, building_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    p.id, p.name, p.file_url, p.user_id ?? null,
    p.ifc_schema ?? null, p.region ?? null,
    p.building_type ?? null, p.metadata ?? null, Date.now()
  ).run();
}

export async function getProjects(db: D1Database, userId?: string | null) {
  if (userId) {
    // Logged-in: own projects + shared (null user_id) projects
    return db.prepare("SELECT * FROM projects WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC").bind(userId).all();
  }
  // Anonymous: only shared projects
  return db.prepare("SELECT * FROM projects WHERE user_id IS NULL ORDER BY created_at DESC").all();
}

export async function getProject(db: D1Database, id: string) {
  return db.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
}

export async function insertJob(db: D1Database, j: { id: string; project_id: string }) {
  return db.prepare("INSERT INTO jobs (id, project_id, status, started_at) VALUES (?, ?, 'pending', ?)")
    .bind(j.id, j.project_id, Date.now()).run();
}

export async function updateJob(db: D1Database, id: string, data: { status?: string; completed_at?: number; hf_job_id?: string }) {
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (data.status !== undefined) { sets.push("status = ?"); vals.push(data.status); }
  if (data.completed_at !== undefined) { sets.push("completed_at = ?"); vals.push(data.completed_at); }
  if (data.hf_job_id !== undefined) { sets.push("hf_job_id = ?"); vals.push(data.hf_job_id); }
  if (sets.length === 0) return;
  vals.push(id);
  return db.prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
}

export async function getJob(db: D1Database, id: string) {
  return db.prepare(
    "SELECT j.*, p.name as project_name, p.file_url FROM jobs j LEFT JOIN projects p ON j.project_id = p.id WHERE j.id = ?"
  ).bind(id).first();
}

export async function getJobsByProject(db: D1Database, projectId: string) {
  return db.prepare("SELECT * FROM jobs WHERE project_id = ? ORDER BY started_at DESC").bind(projectId).all();
}

export async function insertCheckResults(db: D1Database, checkResults: any[], elementResults: any[]) {
  const stmts = [
    ...checkResults.map(cr =>
      db.prepare(
        "INSERT INTO check_results (id, job_id, project_id, check_name, team, status, summary, has_elements, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(cr.id, cr.job_id, cr.project_id, cr.check_name, cr.team, cr.status, cr.summary, cr.has_elements, cr.created_at)
    ),
    ...elementResults.map(er =>
      db.prepare(
        "INSERT INTO element_results (id, check_result_id, element_id, element_type, element_name, element_name_long, check_status, actual_value, required_value, comment, log) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        er.id, er.check_result_id, er.element_id, er.element_type,
        er.element_name, er.element_name_long, er.check_status,
        er.actual_value, er.required_value, er.comment, er.log
      )
    ),
  ];
  if (stmts.length > 0) return db.batch(stmts);
}
