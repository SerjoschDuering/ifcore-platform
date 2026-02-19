import { useState } from "react";
import { useUpload } from "./useUpload";

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const { upload, isUploading } = useUpload();

  return (
    <div className="card">
      <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Upload IFC File</h2>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input
          type="file"
          accept=".ifc"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ flex: 1, fontSize: "0.875rem" }}
        />
        <button
          className="btn btn-primary"
          disabled={!file || isUploading}
          onClick={() => file && upload(file).then(() => setFile(null))}
        >
          {isUploading ? "Uploading..." : "Upload & Check"}
        </button>
      </div>
    </div>
  );
}
