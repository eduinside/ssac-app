"use client";

import { useState, useEffect, useCallback } from "react";
import { storage } from "@/lib/storage";
import type { Progress } from "@/types/vocab";

export function useProgress(id: string) {
  const [progress, setProgress] = useState<Progress>({
    id,
    favorite: false,
    completed: false,
  });

  useEffect(() => {
    storage.getProgress(id).then((p) => {
      if (p) setProgress(p);
    });
  }, [id]);

  const toggleFavorite = useCallback(async () => {
    const next = !progress.favorite;
    setProgress((p) => ({ ...p, favorite: next }));
    await storage.setProgress(id, { favorite: next });
  }, [id, progress.favorite]);

  const toggleCompleted = useCallback(async () => {
    const next = !progress.completed;
    setProgress((p) => ({
      ...p,
      completed: next,
      completedAt: next ? new Date().toISOString() : undefined,
    }));
    await storage.setProgress(id, {
      completed: next,
      completedAt: next ? new Date().toISOString() : undefined,
      lastViewedAt: new Date().toISOString(),
    });
  }, [id, progress.completed]);

  const markViewed = useCallback(async () => {
    await storage.setProgress(id, { lastViewedAt: new Date().toISOString() });
  }, [id]);

  return { progress, toggleFavorite, toggleCompleted, markViewed };
}

export function useGradeProgress(grade: number, totalItems: number) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    storage.getCompleted(`v-g${grade}-`).then((list) => {
      setCompletedCount(list.length);
    });
  }, [grade]);

  return { completedCount, total: totalItems };
}
