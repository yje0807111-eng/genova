"use client";

import { useEffect, useRef } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { upsertWatchHistory } from "@/lib/queries/watch-history-queries";

export function WatchTracker({ videoId }: { videoId: string }) {
  const startTime = useRef<number>(Date.now());
  const savedSeconds = useRef<number>(0);

  useEffect(() => {
    startTime.current = Date.now();

    const save = async () => {
      const supabase = getBrowserSupabaseClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      const progress = savedSeconds.current + elapsed;

      await upsertWatchHistory({
        userId: user.id,
        videoId,
        progressSeconds: progress,
        durationSeconds: progress + 60,
      });
    };

    // Save every 30 seconds
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      savedSeconds.current += elapsed;
      startTime.current = Date.now();
      void save();
    }, 30000);

    // Save on unmount
    return () => {
      clearInterval(interval);
      void save();
    };
  }, [videoId]);

  return null;
}
