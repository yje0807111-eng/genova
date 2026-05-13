"use client";

import { useEffect, useState } from "react";
import { Film, X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

export interface SelectedVideoUploaderProps {
  file: File;
  uploadUrl: string;
  onUploadStart: () => void;
  onProgress: (pct: number) => void;
  onSuccess: () => void;
  onReset: () => void;
  status: "idle" | "uploading" | "processing" | "ready";
  duration: number | null;
}

export function SelectedVideoUploader({
  file,
  uploadUrl,
  onUploadStart,
  onProgress,
  onSuccess,
  onReset,
  status,
  duration,
}: SelectedVideoUploaderProps) {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    setStarted(true);
    onUploadStart();

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setProgress(pct);
        onProgress(pct);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) onSuccess();
    };
    xhr.send(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <Film className="h-4 w-4 shrink-0 text-[#7F77DD]" />
        <p className="min-w-0 flex-1 truncate text-xs text-white/55">{file.name}</p>
        {status === "idle" && (
          <button type="button" onClick={onReset} className="text-white/30 hover:text-white/55">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {status === "uploading" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #534AB7, #7B6FE8)" }}
            />
          </div>
          <p className="text-[11px] text-[#AFA9EC]">{t("upload.uploadProgress").replace("{n}", String(progress))}</p>
        </div>
      )}

      {status === "processing" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-full animate-pulse rounded-full" style={{ background: "linear-gradient(90deg, #534AB7, #7B6FE8)" }} />
          </div>
          <p className="text-[11px] text-amber-400">{t("upload.processingShort")}</p>
        </div>
      )}

      {status === "ready" && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="text-[11px] text-emerald-400">
            Ready to publish
            {duration &&
              ` · ${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(Math.round(duration % 60)).padStart(2, "0")}`}
          </p>
        </div>
      )}
    </div>
  );
}
