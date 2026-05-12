"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Progress } from "@/types/vocab";

interface EduDB extends DBSchema {
  progress: {
    key: string;
    value: Progress;
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

let dbPromise: Promise<IDBPDatabase<EduDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EduDB>("ssac-app", 1, {
      upgrade(db) {
        db.createObjectStore("progress", { keyPath: "id" });
        db.createObjectStore("settings", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export const storage = {
  async getProgress(id: string): Promise<Progress | undefined> {
    const db = await getDB();
    return db.get("progress", id);
  },

  async setProgress(id: string, updates: Partial<Omit<Progress, "id">>): Promise<void> {
    const db = await getDB();
    const existing = await db.get("progress", id);
    const next: Progress = {
      id,
      favorite: false,
      completed: false,
      ...existing,
      ...updates,
    };
    await db.put("progress", next);
  },

  async getAllProgress(): Promise<Progress[]> {
    const db = await getDB();
    return db.getAll("progress");
  },

  async getFavorites(prefix?: string): Promise<Progress[]> {
    const all = await this.getAllProgress();
    return all.filter(
      (p) => p.favorite && (!prefix || p.id.startsWith(prefix))
    );
  },

  async getCompleted(prefix?: string): Promise<Progress[]> {
    const all = await this.getAllProgress();
    return all.filter(
      (p) => p.completed && (!prefix || p.id.startsWith(prefix))
    );
  },

  async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    const db = await getDB();
    const row = await db.get("settings", key);
    return row?.value as T | undefined;
  },

  async setSetting(key: string, value: unknown): Promise<void> {
    const db = await getDB();
    await db.put("settings", { key, value });
  },

  async clearAll(): Promise<void> {
    const db = await getDB();
    await db.clear("progress");
    await db.clear("settings");
  },
};
