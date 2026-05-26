import { get, set, del, createStore, keys } from "idb-keyval";
import type { Subject } from "@content/schema";
import { nanoid } from "nanoid";

const store = createStore("ssac-app", "kv");

// ── Types ──────────────────────────────────────────────────────────
export type Student = {
  id: string;
  name: string;
  grade: number;
  createdAt: number;
};
export type ItemProgress = {
  done: boolean;
  starred: boolean;
  score?: number;
  text?: string;
  lastVisitedAt: number;
};
export type RecentEntry = {
  subject: Subject;
  itemId: string;
  label: string;
  grade: number;
  semester?: number;
  at: number;
};

// ── Key builders ────────────────────────────────────────────────────
const K = {
  students:        "students",
  activeStudentId: "activeStudentId",
  progress: (sid: string, subject: Subject, id: string) => `p|${sid}|${subject}|${id}`,
  recent:   (sid: string) => `r|${sid}`,
  badges:   (sid: string) => `b|${sid}`,
  badgeTimes: (sid: string) => `bt|${sid}`,  // code → timestamp
};

// ── Students ────────────────────────────────────────────────────────
export async function getStudents(): Promise<Student[]> {
  return (await get<Student[]>(K.students, store)) ?? [];
}

export async function getActiveStudentId(): Promise<string | null> {
  return (await get<string>(K.activeStudentId, store)) ?? null;
}

export async function getActiveStudent(): Promise<Student | null> {
  const [students, id] = await Promise.all([getStudents(), getActiveStudentId()]);
  return students.find((s) => s.id === id) ?? null;
}

export function emitStudentChanged() {
  window.dispatchEvent(new CustomEvent("ssac:student-changed"));
}

export async function addStudent(name: string, grade: number): Promise<Student> {
  const student: Student = { id: nanoid(8), name, grade, createdAt: Date.now() };
  const all = await getStudents();
  await set(K.students, [...all, student], store);
  await set(K.activeStudentId, student.id, store);
  emitStudentChanged();
  return student;
}

export async function updateStudent(id: string, patch: Partial<Pick<Student, "name" | "grade">>) {
  const all = await getStudents();
  const next = all.map((s) => (s.id === id ? { ...s, ...patch } : s));
  await set(K.students, next, store);
}

export async function switchStudent(id: string) {
  await set(K.activeStudentId, id, store);
  emitStudentChanged();
}

export async function deleteStudent(id: string) {
  const all = await getStudents();
  const next = all.filter((s) => s.id !== id);
  await set(K.students, next, store);

  // Clean up associated data
  const allKeys = await keys(store);
  const toDelete = allKeys.filter(
    (k) => typeof k === "string" && (k.startsWith(`p|${id}|`) || k === `r|${id}` || k === `b|${id}`)
  );
  await Promise.all(toDelete.map((k) => del(k, store)));

  // Switch to first remaining student or clear
  const active = await getActiveStudentId();
  if (active === id) {
    if (next.length > 0) await set(K.activeStudentId, next[0].id, store);
    else await del(K.activeStudentId, store);
  }
}

// ── Legacy compat shim (used by older code) ─────────────────────────
/** @deprecated use getActiveStudent() */
export async function getProfile() {
  const s = await getActiveStudent();
  if (!s) return null;
  return { grade: s.grade, nickname: s.name, createdAt: s.createdAt };
}

// ── Progress ────────────────────────────────────────────────────────
export async function getProgress(subject: Subject, id: string, studentId?: string): Promise<ItemProgress | undefined> {
  const sid = studentId ?? (await getActiveStudentId());
  if (!sid) return undefined;
  return get<ItemProgress>(K.progress(sid, subject, id), store);
}

export async function patchProgress(
  subject: Subject,
  id: string,
  patch: Partial<ItemProgress>,
  studentId?: string
): Promise<ItemProgress> {
  const sid = studentId ?? (await getActiveStudentId()) ?? "default";
  const prev = (await get<ItemProgress>(K.progress(sid, subject, id), store)) ?? {
    done: false,
    starred: false,
    lastVisitedAt: 0,
  };
  const next: ItemProgress = { ...prev, ...patch, lastVisitedAt: Date.now() };
  await set(K.progress(sid, subject, id), next, store);
  return next;
}

export async function getAllProgress(subject: Subject, studentId?: string): Promise<Record<string, ItemProgress>> {
  const sid = studentId ?? (await getActiveStudentId());
  if (!sid) return {};
  const allKeys = await keys(store);
  const prefix = `p|${sid}|${subject}|`;
  const out: Record<string, ItemProgress> = {};
  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(prefix)) {
      const v = await get<ItemProgress>(k, store);
      if (v) out[k.slice(prefix.length)] = v;
    }
  }
  return out;
}

/** All progress across all subjects for a student (for admin/export) */
export async function getAllProgressForStudent(studentId: string): Promise<Record<string, ItemProgress>> {
  const allKeys = await keys(store);
  const prefix = `p|${studentId}|`;
  const out: Record<string, ItemProgress> = {};
  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(prefix)) {
      const v = await get<ItemProgress>(k, store);
      if (v) out[k.slice(prefix.length)] = v;
    }
  }
  return out;
}

export async function getReviewWatchCount(studentId?: string): Promise<number> {
  const sid = studentId ?? (await getActiveStudentId());
  if (!sid) return 0;
  return (await get<number>(`p|${sid}|review_watch_count`, store)) ?? 0;
}

export async function incrementReviewWatchCount(studentId?: string): Promise<number> {
  const sid = studentId ?? (await getActiveStudentId()) ?? "default";
  const cur = await getReviewWatchCount(sid);
  const next = cur + 1;
  await set(`p|${sid}|review_watch_count`, next, store);
  return next;
}

// ── Recent ──────────────────────────────────────────────────────────
export async function pushRecent(entry: Omit<RecentEntry, "at">, studentId?: string) {
  const sid = studentId ?? (await getActiveStudentId());
  if (!sid) return;
  const arr = (await get<RecentEntry[]>(K.recent(sid), store)) ?? [];
  const filtered = arr.filter((r) => !(r.subject === entry.subject && r.itemId === entry.itemId));
  filtered.unshift({ ...entry, at: Date.now() });
  await set(K.recent(sid), filtered.slice(0, 20), store);
}

export async function getRecent(studentId?: string): Promise<RecentEntry[]> {
  const sid = studentId ?? (await getActiveStudentId());
  if (!sid) return [];
  return (await get<RecentEntry[]>(K.recent(sid), store)) ?? [];
}

// ── Badges ──────────────────────────────────────────────────────────
export async function getBadges(studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId());
  if (!sid) return [];
  return (await get<string[]>(K.badges(sid), store)) ?? [];
}

export async function getBadgeTimes(studentId?: string): Promise<Record<string, number>> {
  const sid = studentId ?? (await getActiveStudentId());
  if (!sid) return {};
  return (await get<Record<string, number>>(K.badgeTimes(sid), store)) ?? {};
}

export async function addBadge(code: string, studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? "default";
  const cur = await getBadges(sid);
  if (cur.includes(code)) return cur;
  const next = [...cur, code];
  await set(K.badges(sid), next, store);
  // 획득 날짜 기록
  const times = (await get<Record<string, number>>(K.badgeTimes(sid), store)) ?? {};
  if (!times[code]) {
    times[code] = Date.now();
    await set(K.badgeTimes(sid), times, store);
  }
  return next;
}

// ── Full reset ──────────────────────────────────────────────────────
export async function resetAll() {
  const allKeys = await keys(store);
  await Promise.all(allKeys.map((k) => del(k, store)));
}

// ── DB 복구: IndexedDB 자체를 삭제하고 리로드 ──────────────────────
export function nukeAndReload() {
  try { indexedDB.deleteDatabase("ssac-app"); } catch { /* ignore */ }
  window.location.reload();
}
