import { useState } from "react";
import { uploadFile, startCheck, getProjects } from "../../lib/api";
import { useStore } from "../../stores/store";
import { startPolling } from "../../lib/poller";

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File) {
    setIsUploading(true);
    try {
      const { project_id, file_url } = await uploadFile(file);
      const result = await startCheck(project_id, file_url);
      useStore.getState().trackJob({
        id: result.job_id,
        project_id,
        status: "running",
        started_at: Date.now(),
        completed_at: null,
      });
      startPolling();
      const projects = await getProjects();
      useStore.getState().setProjects(projects);
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
