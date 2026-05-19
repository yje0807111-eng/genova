"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { createVideoAction } from "@/app/actions/video";
import { useI18n } from "@/components/genova/language-provider";

export type UploadStatus = "uploading" | "processing" | "ready" | "failed";

export interface UploadJob {
  id: string;
  title: string;
  videoFile: File;
  thumbnailFile: File | null;
  metadata: {
    genre: string;
    purpose: "personal" | "competition";
    competitionId?: string | null;
    description?: string;
    tags?: string[];
    workflow?: import("@/lib/types").VideoWorkflow | null;
    additionalGenres?: string[];
    isSeriesMode?: boolean;
    seriesName?: string | null;
    episodeNumber?: number | null;
    /** Phase 3-2: "본인 제작" attestation flag.  Forwarded to
     *  createVideoAction → issue_lottery_ticket RPC.  Tickets are
     *  only attempted when true. */
    originalAttestation?: boolean;
  };
  status: UploadStatus;
  progress: number;
  muxUploadId: string | null;
  muxPlaybackId: string | null;
  muxAssetId: string | null;
  duration: number | null;
  videoId: string | null;
  errorMessage: string | null;
  createdAt: number;
}

interface UploadContextValue {
  jobs: UploadJob[];
  addJob: (input: AddJobInput) => string;
  removeJob: (id: string) => void;
  retryJob: (id: string) => void;
}

interface AddJobInput {
  title: string;
  videoFile: File;
  thumbnailFile: File | null;
  metadata: UploadJob["metadata"];
}

/**
 * Maps the machine-readable `reason` strings returned by
 * createVideoAction's LotteryIssuance (see Phase 2A errcodes) to
 * the i18n key suffix under `lottery.reason.*`.  Unknown reasons
 * fall through and just get the raw reason rendered as-is.
 */
function reasonToKey(reason: string): string {
  switch (reason) {
    case "monthly_limit_reached":
      return "monthlyLimit";
    case "duration_below_threshold":
      return "duration";
    case "no_attestation":
      return "noAttestation";
    case "not_owner":
      return "notOwner";
    case "video_not_found":
      return "videoNotFound";
    default:
      return reason;
  }
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const jobsRef = useRef<UploadJob[]>([]);
  jobsRef.current = jobs;

  const updateJob = useCallback((id: string, updates: Partial<UploadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  }, []);

  const processJob = useCallback(async (job: UploadJob) => {
    try {
      const uploadRes = await fetch("/api/mux/upload", { method: "POST" });
      if (!uploadRes.ok) throw new Error(t("uploadCtx.muxUrlFailed", "Failed to issue Mux upload URL"));
      const { uploadUrl, uploadId } = await uploadRes.json();
      updateJob(job.id, { muxUploadId: uploadId, progress: 5 });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = (e.loaded / e.total) * 100;
            updateJob(job.id, { progress: 5 + pct * 0.6 });
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(t("uploadCtx.uploadFailed", "Upload failed"))));
        xhr.onerror = () => reject(new Error(t("uploadCtx.networkError", "Network error")));
        xhr.send(job.videoFile);
      });

      updateJob(job.id, { progress: 65 });

      updateJob(job.id, { status: "processing", progress: 70 });
      const asset = await pollMuxAsset(uploadId, {
        errored: t("uploadCtx.muxProcessFailed", "Mux processing failed"),
        timeout: t("uploadCtx.muxProcessTimeout", "Mux processing timed out"),
      });
      updateJob(job.id, {
        muxPlaybackId: asset.playbackId,
        muxAssetId: asset.assetId,
        duration: asset.duration ?? null,
        progress: 90,
      });

      const result = await createVideoAction({
        title: job.title.trim(),
        thumbnailUrl: "",
        backdropUrl: null,
        genre: job.metadata.genre,
        additionalGenres: job.metadata.additionalGenres ?? [],
        purpose: job.metadata.purpose,
        aiTools: [],
        workflow: job.metadata.workflow ?? null,
        tags: job.metadata.tags ?? [],
        seriesName: job.metadata.seriesName ?? null,
        episodeNumber: job.metadata.episodeNumber ?? null,
        description: job.metadata.description ?? "",
        runtimeMinutes: (asset.duration ?? 0) / 60,
        visibility: "public",
        submittedCompetitionId: job.metadata.competitionId ?? null,
        muxPlaybackId: asset.playbackId,
        muxAssetId: asset.assetId,
        muxUploadId: uploadId,
        // Phase 2B/3-2: forward Mux-reported seconds + the
        // user's attestation flag through to the action; the
        // action returns a `lottery` discriminated-union for the
        // toast emission below.
        durationSeconds: Math.round(asset.duration ?? 0),
        originalAttestation: job.metadata.originalAttestation === true,
      });

      if (!result.ok) throw new Error(result.message);

      updateJob(job.id, {
        status: "ready",
        progress: 100,
        videoId: result.videoId,
      });

      // 업로드 시작·완료 알림은 우측 하단 UploadProgressWidget 이
      // 진행률·완료·"보기" 링크까지 지속적으로 보여주므로 toast 로
      // 중복 표시하지 않는다. (위젯이 없는 정보인 응모권 결과만 toast)

      // Phase 3-2: lottery feedback toast.  Only emit when the user
      // actually opted in (originalAttestation === true) — silent
      // for unchecked uploads since the absence of a ticket isn't
      // news. For attested uploads we show either the success
      // (with "(N/5)" badge) or the precise skip reason.
      if (job.metadata.originalAttestation === true && result.lottery) {
        if (result.lottery.ok) {
          const msg = t(
            "lottery.toastIssued",
            "\"{title}\" entered the lottery ({used}/5 this month)",
          )
            .replace("{title}", job.title)
            .replace("{used}", String(result.lottery.monthlyCount));
          toast.success(msg);
        } else {
          const reasonKey = `lottery.reason.${reasonToKey(result.lottery.reason)}`;
          const reasonCopy = t(reasonKey, result.lottery.reason);
          toast.warning(
            t("lottery.toastSkipped", "No ticket issued") + " · " + reasonCopy,
          );
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("uploadCtx.unknownError", "Unknown error");
      updateJob(job.id, {
        status: "failed",
        errorMessage: message,
      });
      toast.error(t("uploadCtx.uploadFailedPrefix", "Upload failed: {message}").replace("{message}", message));
    }
  }, [updateJob]);

  const addJob = useCallback((input: AddJobInput) => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newJob: UploadJob = {
      id,
      title: input.title,
      videoFile: input.videoFile,
      thumbnailFile: input.thumbnailFile,
      metadata: input.metadata,
      status: "uploading",
      progress: 0,
      muxUploadId: null,
      muxPlaybackId: null,
      muxAssetId: null,
      duration: null,
      videoId: null,
      errorMessage: null,
      createdAt: Date.now(),
    };
    setJobs((prev) => [...prev, newJob]);
    void processJob(newJob);
    return id;
  }, [processJob]);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const retryJob = useCallback((id: string) => {
    const job = jobsRef.current.find((j) => j.id === id);
    if (!job) return;
    updateJob(id, { status: "uploading", progress: 0, errorMessage: null });
    void processJob(job);
  }, [processJob, updateJob]);

  return (
    <UploadContext.Provider value={{ jobs, addJob, removeJob, retryJob }}>
      {children}
    </UploadContext.Provider>
  );
}

async function pollMuxAsset(
  uploadId: string,
  errorCopy: { errored: string; timeout: string },
): Promise<{
  playbackId: string;
  assetId: string;
  duration: number | null;
}> {
  const MAX_ATTEMPTS = 60;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const res = await fetch(`/api/mux/asset?uploadId=${uploadId}`);
    if (!res.ok) {
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    const data = await res.json();
    if (data.status === "ready" && data.playbackId && data.assetId) {
      return {
        playbackId: data.playbackId,
        assetId: data.assetId,
        duration: data.duration ?? null,
      };
    }
    if (data.status === "errored") {
      throw new Error(errorCopy.errored);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(errorCopy.timeout);
}
