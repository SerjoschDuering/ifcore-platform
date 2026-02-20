import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUpload } from "./useUpload";

export function UploadForm({ variant = "card" }: { variant?: "card" | "toolbar" }) {
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { upload, isUploading } = useUpload();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onUpload() {
    if (!file) return;
    setFeedback(null);
    try {
      await upload(file, {
        onSuccess: ({ project_id }) => {
          setFeedback("Checks running");
          setFile(null);
          navigate({ to: "/projects/$id", params: { id: project_id } });
        },
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Upload failed");
    }
  }

  if (variant === "toolbar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          ref={fileRef}
          type="file"
          accept=".ifc"
          disabled={isUploading}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0 }}
        />
        <button
          className="toolbar-btn"
          style={{ cursor: isUploading ? "not-allowed" : "pointer" }}
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
        >
          {file ? "IFC Ready" : "Choose IFC"}
        </button>
        {file && (
          <span className="glass-chip" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </span>
        )}
        {file && (
          <button className="toolbar-btn toolbar-btn-primary" disabled={isUploading} onClick={onUpload}>
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        )}
        {feedback && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{feedback}</span>}
      </div>
    );
  }

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
        <button className="btn btn-primary" disabled={!file || isUploading} onClick={onUpload}>
          {isUploading ? "Uploading…" : "Upload & Check"}
        </button>
      </div>
      {feedback && <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>{feedback}</p>}
    </div>
  );
}
