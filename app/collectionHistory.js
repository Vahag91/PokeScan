// utils/collectionHistory.js
// Minimal per-collection daily total history using RNFS (no DB/schema changes)

import RNFS from 'react-native-fs';

const DIR = RNFS.DocumentDirectoryPath;               // app-private sandbox
const RETENTION_CAP = 450;                             // keep ~15 months (1 point/day)

/** YYYY-MM-DD in UTC (stable, no DST issues) */
export function dateKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function filePathFor(collectionId) {
  // Keep it simple; collectionId comes from your DB UUIDs
  return `${DIR}/collection_history_${collectionId}.json`;
}

async function readFileJSON(path) {
  try {
    const txt = await RNFS.readFile(path, 'utf8');
    const parsed = JSON.parse(txt);
    return (parsed && Array.isArray(parsed.points)) ? parsed : { points: [] };
  } catch {
    return { points: [] };
  }
}

/** Atomic-ish write: write to tmp, then replace */
async function writeFileJSONAtomic(path, obj) {
  const tmp = `${path}.tmp`;
  const payload = JSON.stringify(obj);
  await RNFS.writeFile(tmp, payload, 'utf8');
  try { await RNFS.unlink(path); } catch { /* ignore if not exists */ }
  await RNFS.moveFile(tmp, path);
}

/**
 * Read full history (optionally filter by last N days).
 * Returns [{ date: 'YYYY-MM-DD', totalValue: number }, ...] sorted ASC.
 */
export async function readHistory(collectionId, { days = null } = {}) {
  const path = filePathFor(collectionId);
  let { points } = await readFileJSON(path);

  // sort ascending by date string
  points = points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (days && Number.isFinite(days)) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const sinceKey = dateKeyUTC(since);
    points = points.filter(p => p.date >= sinceKey);
  }

  return points;
}

/**
 * Upsert a single (date, totalValue) point for a collection.
 * Overwrites if the date already exists. Trims to RETENTION_CAP oldest.
 */
export async function upsertHistoryPoint(collectionId, dateStr, totalValue) {
  const path = filePathFor(collectionId);
  let { points } = await readFileJSON(path);

  const next = [...points];
  const idx = next.findIndex(p => p.date === dateStr);
  const val = Number(totalValue) || 0;

  if (idx >= 0) next[idx] = { date: dateStr, totalValue: val };
  else next.push({ date: dateStr, totalValue: val });

  // sort + cap
  next.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const trimmed = next.length > RETENTION_CAP ? next.slice(next.length - RETENTION_CAP) : next;

  await writeFileJSONAtomic(path, { points: trimmed });
}

/** Convenience: upsert today's UTC point */
export async function upsertToday(collectionId, totalValue) {
  return upsertHistoryPoint(collectionId, dateKeyUTC(), totalValue);
}

/** Remove a collection's sidecar history file (e.g., after deleting the collection) */
export async function deleteCollectionHistory(collectionId) {
  const path = filePathFor(collectionId);
  try { await RNFS.unlink(path); } catch { /* ignore if already gone */ }
}

/** (Optional) expose the resolved file path for debugging */
export function getHistoryFilePath(collectionId) {
  return filePathFor(collectionId);
}
