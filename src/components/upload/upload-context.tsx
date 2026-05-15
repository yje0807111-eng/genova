"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { createVideoAction } from "@/app/actions/video";

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
    subGenre?: string | null;
    additionalGenres?: string[];
    isSeriesMode?: boolean;
    seriesName?: string | null;
    episodeNumber?: number | null;
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

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const jobsRef = useRef<UploadJob[]>([]);
  jobsRef.current = jobs;

  const updateJob = useCallback((id: string, updates: Partial<UploadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  }, []);

  const processJob = useCallback(async (job: UploadJob) => {
    try {
      const uploadRes = await fetch("/api/mux/upload", { method: "POST" });
      if (!uploadRes.ok) throw new Error("Mux upload URL 발급 실패");
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
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("업로드 실패")));
        xhr.onerror = () => reject(new Error("네트워크 오류"));
        xhr.send(job.videoFile);
      });

      updateJob(job.id, { progress: 65 });

      updateJob(job.id, { status: "processing", progress: 70 });
      const asset = await pollMuxAsset(uploadId);
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
        subGenre: job.metadata.subGenre ?? null,
        purpose: job.metadata.purpose,
        aiTools: [],
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
        // Phase 2B: pass the Mux-reported duration to the action so
        // it can persist videos.duration_seconds and gate lottery
        // ticket issuance. `originalAttestation` flips true once
        // Phase 3 wires the checkbox on the multi-upload UI; until
        // then this upload path issues no tickets.
        durationSeconds: Math.round(asset.duration ?? 0),
        originalAttestation: false,
      });

      if (!result.ok) throw new Error(result.message);

      updateJob(job.id, {
        status: "ready",
        progress: 100,
        videoId: result.videoId,
      });

      toast.success(`"${job.title}" 업로드 완료`, {
        action: {
          label: "보기",
          onClick: () => window.location.assign(`/watch/${result.videoId}`),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      updateJob(job.id, {
        status: "failed",
        errorMessage: message,
      });
      toast.error(`업로드 실패: ${message}`);
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

async function pollMuxAsset(uploadId: string): Promise<{
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
      throw new Error("Mux 처리 실패");
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Mux 처리 시간 초과");
}
