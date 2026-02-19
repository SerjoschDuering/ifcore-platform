CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  team TEXT,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  ifc_schema TEXT,
  region TEXT,
  building_type TEXT,
  metadata TEXT,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  status TEXT DEFAULT 'pending',
  glb_url TEXT,
  started_at INTEGER,
  completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS check_results (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id),
  project_id TEXT REFERENCES projects(id),
  check_name TEXT NOT NULL,
  team TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  summary TEXT,
  has_elements INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS element_results (
  id TEXT PRIMARY KEY,
  check_result_id TEXT REFERENCES check_results(id),
  element_id TEXT,
  element_type TEXT,
  element_name TEXT,
  element_name_long TEXT,
  check_status TEXT DEFAULT 'blocked',
  actual_value TEXT,
  required_value TEXT,
  comment TEXT,
  log TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_check_results_job ON check_results(job_id);
CREATE INDEX IF NOT EXISTS idx_element_results_check ON element_results(check_result_id);
