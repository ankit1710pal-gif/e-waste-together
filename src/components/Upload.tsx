import { Plus } from "lucide-react";
export interface UploadProps {
  target: "photo" | "receipt";
  recordId: string;
  busy: boolean;
  attach: (
    target: "photo" | "receipt",
    recordId: string,
    file?: File,
  ) => Promise<void>;
}
export function Upload({ target, recordId, busy, attach }: UploadProps) {
  return (
    <label className={`upload-button ${busy ? "disabled" : ""}`}>
      <Plus size={14} /> {target === "photo" ? "Add photo" : "Attach receipt"}
      <input
        aria-label={
          target === "photo" ? "Upload item photo" : "Upload handover receipt"
        }
        type="file"
        accept={
          target === "photo"
            ? "image/png,image/jpeg"
            : "image/png,image/jpeg,application/pdf"
        }
        disabled={busy}
        onChange={(e) => {
          void attach(target, recordId, e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}
