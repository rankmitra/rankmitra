/**
 * filters.js
 * Pure filtering functions for College Predictor and Cutoff Explorer.
 * All functions are stateless — input data in, filtered array out.
 */

// ─── College Predictor ───────────────────────────────────────────────────────

/**
 * Main predictor filter.
 *
 * @param {Object[]} data      - Full dataset (final-round rows)
 * @param {Object}   params
 * @param {number}   params.rank          - Student's CRL rank
 * @param {string}   params.category      - e.g. "OPEN", "OBC-NCL", "SC", "ST", "EWS"
 * @param {string}   params.gender        - "Gender-Neutral" | "Female-only (including Supernumerary)"
 * @param {string}   params.quota         - "AI" | "OS" | "HS" | ...
 * @param {string[]} params.instituteTypes - ["IIT","NIT","IIIT","GFTI"] or subset
 * @param {string[]} params.programs       - [] means all; otherwise filter to these
 * @param {number}   params.year          - e.g. 2024
 * @param {boolean}  params.includePwd    - include PwD seat rows?
 * @returns {Object[]} filtered rows, sorted by closing_rank_int asc
 */
export function getChancePercent(row, rank) {
  const closing = row.closing_rank_int;

  if (!closing) return 0;

  const ratio = rank / closing;

  if (ratio <= 0.7) return 95;
  if (ratio <= 0.8) return 85;
  if (ratio <= 0.9) return 75;
  if (ratio <= 1.0) return 65;

  return Math.max(
    10,
    Math.round(65 - ((ratio - 1) * 100))
  );
}
export function predictColleges(data, params) {
  const {
    rank,
    category,
    gender,
    quota,
    instituteTypes = [],
    programs = [],
    year,
    includePwd = false,
  } = params;

  if (!rank || !category || !gender || !quota) return [];

  // Derive the PwD-equivalent seat type if category includes (PwD)
  const isPwdCategory = category.includes('(PwD)');

  let rows = data.filter((row) => {
    // Year filter
    if (row.year !== year) return false;

    // Skip PwD-list rows unless explicitly requested or category is PwD
    if (row.opening_is_pwd && !isPwdCategory && !includePwd) return false;

    // Category / seat type
    if (row.category !== category) return false;

    // Gender — female-only rows are always eligible for female students;
    // gender-neutral rows are eligible for everyone.
    if (gender === 'Gender-Neutral') {
      if (row.gender !== 'Gender-Neutral') return false;
    }
    // If student is female, show both gender-neutral AND female-only rows
    // (female students can compete for both pools)

    // Quota
    if (row.quota !== quota) return false;

    // Institute type filter
    if (instituteTypes.length > 0 && !instituteTypes.includes(row.institute_type)) return false;

    // Program / branch filter
    if (programs.length > 0 && !programs.includes(row.program)) return false;

    // Rank eligibility — student's rank must be ≤ closing rank
    if (row.closing_rank_int == null) return false;

    const ratio = rank / row.closing_rank_int;

    // keep colleges where student is not too far away
    return ratio <= 1.20;
  });

  // Sort by closing rank ascending (easiest admits first for "safe" feel)
  rows.sort((a, b) => (a.closing_rank_int ?? 0) - (b.closing_rank_int ?? 0));

  return rows;
}

/**
 * Classify each result row as Safe / Match / Reach.
 *
 * Safe  = student rank is comfortably below closing rank (rank ≤ closing × 0.85)
 * Match = student rank is close to closing rank (0.85 < rank/closing ≤ 1.0)
 * Reach = student rank is above closing rank (rank > closing) — included for
 *          aspirational display when caller opts in
 *
 * Note: For JEE, LOWER rank = BETTER. So rank 100 is safer for a seat with
 * closing rank 1000 than rank 900.
 */



export function classifyResult(row, studentRank) {
  const closing = row.closing_rank_int;

  if (!closing) return 'unknown';

  const ratio = studentRank / closing;

  if (ratio <= 0.70) return 'safe';
  if (ratio <= 1.00) return 'match';
  return 'reach';
}




// ─── Cutoff Explorer ─────────────────────────────────────────────────────────

/**
 * Look up cutoffs for a specific institute+program combination.
 * Returns all matching rows (can span multiple years/rounds/categories).
 *
 * @param {Object[]} data
 * @param {Object}   params
 * @param {string}   params.institute
 * @param {string}   params.program      - optional; null = all programs
 * @param {string}   params.category     - optional; null = all
 * @param {string}   params.gender       - optional; null = all
 * @param {string}   params.quota        - optional; null = all
 * @param {number[]} params.years        - optional; [] = all years
 * @param {boolean}  params.finalRoundOnly
 */
export function exploreCutoffs(data, params) {
  const {
    institute,
    program = null,
    category = null,
    gender = null,
    quota = null,
    years = [],
    finalRoundOnly = true,
  } = params;

  if (!institute) return [];

  return data.filter((row) => {
    if (row.institute !== institute) return false;
    if (program   && row.program   !== program)   return false;
    if (category  && row.category  !== category)  return false;
    if (gender    && row.gender    !== gender)     return false;
    if (quota     && row.quota     !== quota)      return false;
    if (years.length > 0 && !years.includes(row.year)) return false;
    if (finalRoundOnly && !row.is_final_round)    return false;
    return true;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format rank for display — adds comma separators */
export function formatRank(rank) {
  if (rank == null || rank === '') return '—';
  return Number(rank).toLocaleString('en-IN');
}

/** Shorten program name for compact display */
export function shortProgram(name) {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Institute type → badge colour class */
export const TYPE_COLORS = {
  IIT:  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  NIT:  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  IIIT: { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200'},
  GFTI: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
};

export const CLASS_COLORS = {
  safe:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'Safe'  },
  match:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   label: 'Match' },
  reach:   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Reach' },
  unknown: { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200',   label: '—'     },
};
