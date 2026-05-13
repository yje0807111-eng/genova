"use client";

import { useUpload, type UploadJob } from "@/components/upload/upload-context";
import { X, CheckCircle2, AlertCircle, Upload as UploadIcon, RotateCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function UploadProgressWidget() {
  const { jobs, removeJob, retryJob } = useUpload();
  const [expanded, setExpanded] = useState(true);

  const visibleJobs = jobs;

  if (visibleJobs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between border-b border-white/[0.05] px-4 py-3 text-left hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <UploadIcon className="h-3.5 w-3.5 text-[#AFA9EC]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            업로드 ({visibleJobs.length})
          </p>
        </div>
        <span className="text-[10px] text-white/40">
          {expanded ? "접기" : "펼치기"}
        </span>
      </button>

      {expanded && (
        <div className="max-h-[400px] overflow-y-auto">
          {visibleJobs.map((job) => (
            <UploadJobItem
              key={job.id}
              job={job}
              onRemove={() => removeJob(job.id)}
              onRetry={() => retryJob(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadJobItem({
  job,
  onRemove,
  onRetry,
}: {
  job: UploadJob;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="border-b border-white/[0.04] px-4 py-3 last:border-b-0">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-1 flex-1 text-[13px] font-bold text-white">
          {job.title}
        </p>
        {(job.status === "ready" || job.status === "failed") && (
          <button
            type="button"
            onClick={onRemove}
            className="text-white/40 hover:text-white/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {job.status === "uploading" && (
        <>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/55">
            <span>업로드 중</span>
            <span className="tabular-nums">{Math.round(job.progress)}%</span>
          </div>
          <ProgressBar progress={job.progress} />
        </>
      )}

      {job.status === "processing" && (
        <>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#AFA9EC]" />
              영상 처리 중
            </span>
            <span className="tabular-nums">{Math.round(job.progress)}%</span>
          </div>
          <ProgressBar progress={job.progress} />
        </>
      )}

      {job.status === "ready" && (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            업로드 완료
          </span>
          {job.videoId && (
            <Link
              href={`/watch/${job.videoId}`}
              className="text-[11px] font-bold text-[#AFA9EC] hover:text-white"
            >
              보기 →
            </Link>
          )}
        </div>
      )}

      {job.status === "failed" && (
        <>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="line-clamp-2">{job.errorMessage ?? "업로드 실패"}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#AFA9EC] hover:text-white"
          >
            <RotateCw className="h-3 w-3" />
            다시 시도
          </button>
        </>
      )}
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#534AB7] transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
