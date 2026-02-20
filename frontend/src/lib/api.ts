import type { Project, Job } from "./types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  return request("/projects");
}

export async function getProject(id: string): Promise<Project & { jobs: Job[] }> {
  return request(`/projects/${id}`);
}

export async function uploadFile(file: File): Promise<{ project_id: string; file_url: string }> {
  const form = new FormData();
  form.append("file", file);
  return request("/upload", { method: "POST", body: form });
}

export async function startCheck(projectId: string, fileUrl: string): Promise<{ job_id: string; status: string }> {
  return request("/checks/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, file_url: fileUrl }),
  });
}

export async function getJob(id: string): Promise<Job> {
  return request(`/checks/jobs/${id}`);
}
