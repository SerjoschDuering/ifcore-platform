export type Project = {
  id: string;
  user_id: string | null;
  name: string;
  file_url: string;
  ifc_schema: string | null;
  region: string | null;
  building_type: string | null;
  metadata: string | null;
  created_at: number;
};

export type Job = {
  id: string;
  project_id: string;
  status: "pending" | "running" | "done" | "error";
  started_at: number | null;
  completed_at: number | null;
  project_name?: string;
  file_url?: string;
  check_results?: CheckResult[];
  element_results?: ElementResult[];
};

export type CheckResult = {
  id: string;
  job_id: string;
  project_id: string;
  check_name: string;
  team: string;
  status: "running" | "pass" | "fail" | "unknown" | "error";
  summary: string;
  has_elements: 0 | 1;
  created_at: number;
};

export type ElementResult = {
  id: string;
  check_result_id: string;
  element_id: string | null;
  element_type: string | null;
  element_name: string | null;
  element_name_long: string | null;
  check_status: "pass" | "fail" | "warning" | "blocked" | "log";
  actual_value: string | null;
  required_value: string | null;
  comment: string | null;
  log: string | null;
};
