/**
 * dataLoader.js
 * Fetches and parses the columnar compact JSON format.
 * Columnar format: { columns: [...], rows: [[v1, v2, ...], ...] }
 * This is ~4x smaller than row-of-objects JSON.
 */

let finalCache = null;
let allCache = null;
let metaCache = null;

/**
 * Inflate columnar JSON → array of plain objects
 */
function inflate(columnar) {
  const { columns, rows } = columnar;
  return rows.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

export async function loadMeta() {
  if (metaCache) return metaCache;
  const res = await fetch('/data/meta.json');
  if (!res.ok) throw new Error('Failed to load meta.json');
  metaCache = await res.json();
  return metaCache;
}

/**
 * Load final-round rows only (~72K rows, ~1.2MB gzipped).
 * Used for College Predictor — fast startup.
 */
export async function loadFinalData() {
  if (finalCache) return finalCache;
  const res = await fetch('/data/cutoffs_final_compact.json');
  if (!res.ok) throw new Error('Failed to load cutoffs_final_compact.json');
  const columnar = await res.json();
  finalCache = inflate(columnar);
  return finalCache;
}

/**
 * Load all rounds (~420K rows, ~7.7MB gzipped).
 * Used for Cutoff Explorer & trend analysis — loaded on demand.
 */
export async function loadAllData() {
  if (allCache) return allCache;
  const res = await fetch('/data/cutoffs_all_compact.json');
  if (!res.ok) throw new Error('Failed to load cutoffs_all_compact.json');
  const columnar = await res.json();
  allCache = inflate(columnar);
  return allCache;
}
