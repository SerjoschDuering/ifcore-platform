import { useState } from "react";
import { uploadFile, startCheck, getProjects } from "../../lib/api";
import { useStore } from "../../stores/store";
import { startPolling } from "../../lib/poller";

type UploadSuccessPayload = {
  project_id: string;
  file_url: string;
  job_id: string;
};

type UploadOptions = {
  onSuccess?: (payload: UploadSuccessPayload) => void;
  onError?: (error: unknown) => void;
};

function toViewerUrl(fileUrl: string) {
  return fileUrl.startsWith("r2://")
    ? `/api/files/${fileUrl.replace("r2://", "")}`
    : fileUrl;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File, options?: UploadOptions) {
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
      useStore.getState().setActiveProject(project_id);
      useStore.getState().setIfcUrl(toViewerUrl(file_url));
      useStore.getState().setViewerVisible(true);
      startPolling();
      const projects = await getProjects();
      useStore.getState().setProjects(projects);
      options?.onSuccess?.({ project_id, file_url, job_id: result.job_id });
    } catch (error) {
      options?.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
