/**
 * Explorer.jsx
 * Cutoff Explorer mode — look up cutoffs for a specific institute/branch/category.
 */
import React, { useState, useMemo } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { Select, Button, Badge, Card, EmptyState, Spinner } from '../ui';
import { exploreCutoffs, formatRank, TYPE_COLORS } from '../../utils/filters';
import { useAllData } from '../../hooks/useData';

export default function Explorer({ meta }) {
  console.log("Explorer rendered");
  const [institute, setInstitute] = useState('');
  const [program, setProgram] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('');
  const [quota, setQuota] = useState('');
  const [finalOnly, setFinalOnly] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isPremium, setIsPremium] = useState(
    localStorage.getItem('rankmitra_premium') === 'true'
  );

  const validCodes = [
    "RM-PREMIUM2007",
    "RM-PREMIUM0008",
    "RM-PREMIUM7232",
    "RM-PREMIUM1500",
    "RM-PREMIUM2026",
  ];


  const handleUnlock = () => {
    const code = accessCode.trim().toUpperCase();

    if (validCodes.includes(code)) {

      localStorage.setItem(
        "rankmitra_premium",
        "true"
      );

      setIsPremium(true);

      const filtered = exploreCutoffs(
        allData,
        {
          institute,
          program,
          category,
          gender,
          quota,
        },
        finalOnly
      );

      setResults(filtered);

      setHasSearched(true);

      setShowPremium(false);

    } else {

      alert("Invalid access code.");

    }
  };

  // Load all-rounds data on demand (only when user first interacts with Explorer)
  const [needsData, setNeedsData] = useState(false);

  const {
  data: allData,
  loading: dataLoading,
  error: dataError
} = useAllData(needsData);

console.log("allData =", allData);
console.log("dataError =", dataError);


  console.log("needsData =", needsData);
  console.log("dataLoading =", dataLoading);
  console.log("allData =", allData?.length);

  const instituteOptions = useMemo(() => [
    { value: '', label: 'Select an institute…', disabled: true },
    ...(meta?.institutes ?? []).map((inst) => ({
      value: inst,
      label: `[${meta?.inst_type_map?.[inst] ?? '?'}] ${inst}`,
    })),
  ], [meta]);

  // Programs for selected institute
  const programOptions = useMemo(() => {
    if (!institute || !allData) return [{ value: '', label: 'Select institute first…', disabled: true }];
   const matchingRows = allData.filter((r) =>
  r.institute.toLowerCase().includes(institute.toLowerCase())
);

console.log("Institute selected:", institute);
console.log("Matching rows:", matchingRows.length);
console.log("First row:", matchingRows[0]);

const programs = [...new Set(
  matchingRows.map((r) => r.program)
)].sort();
    return [
      { value: '', label: 'All programs' },
      ...programs.map((p) => ({ value: p, label: p })),
    ];
  }, [institute, allData]);


  const categoryOptions = useMemo(() => [
    { value: '', label: 'All categories' },
    ...(meta?.categories ?? []).map((c) => ({
      value: c,
      label: meta?.category_descriptions?.[c]
        ? `${c} — ${meta.category_descriptions[c]}`
        : c,
    })),
  ], [meta]);




  const genderOptions = [
    { value: '', label: 'All genders' },
    {
      value: 'Gender-Neutral',
      label: 'Gender-Neutral — Open to all students',
    },
    {
      value: 'Female-only (including Supernumerary)',
      label: 'Female-only — Reserved for female candidates',
    },
  ];



  const quotaOptions = useMemo(() => [
    { value: '', label: 'All quotas' },
    ...(meta?.quotas ?? []).map((q) => ({
      value: q,
      label: meta?.quota_descriptions?.[q]
        ? `${q} — ${meta.quota_descriptions[q]}`
        : q,
    })),
  ], [meta]);





  function handleInstituteChange(val) {
    setInstitute(val);
    setProgram('');
    setNeedsData(true); // trigger all-data load
  }

  function handleSearch() {

    if (isPremium) {
      const filtered = exploreCutoffs(
        allData,
        {
          institute,
          program,
          category,
          gender,
          quota,
        },
        finalOnly
      );

      setResults(filtered);
      setHasSearched(true);

      return;
    }

    setShowPremium(true);
  }

  // Group results by program → year for display


  const years = useMemo(() => {
    if (!results) return [];
    return [...new Set(results.map((r) => r.year))].sort();
  }, [results]);

  const typeColor = meta?.inst_type_map?.[institute]
    ? TYPE_COLORS[meta.inst_type_map[institute]]
    : null;

  const sortedResults = results
    ? [...results].sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year; // newest year first
        }
        return a.round - b.round; // round 1, 2, 3...
      })
    : [];

  return (
    <div>

      

      {/* TEMPORARY */}
      {/* Everything below stays for now */}    
      {/* Form */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Institute"
            value={institute}
            onChange={handleInstituteChange}
            options={instituteOptions}
            className="lg:col-span-1"
          />
          <Select
            label="Program / Branch"
            value={program}
            onChange={setProgram}
            options={programOptions}
            disabled={!institute || (needsData && dataLoading)}
            hint={needsData && dataLoading ? 'Loading programs…' : undefined}
          />
          <Select
            label="Category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
          <Select
            label="Gender"
            value={gender}
            onChange={setGender}
            options={genderOptions}
          />
          <Select
            label="Quota"
            value={quota}
            onChange={setQuota}
            options={quotaOptions}
          />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Round</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setFinalOnly(true)}
                className={`flex-1 py-2.5 text-sm rounded-xl border transition-all cursor-pointer font-medium ${finalOnly ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                Final
              </button>
              <button
                onClick={() => setFinalOnly(false)}
                className={`flex-1 py-2.5 text-sm rounded-xl border transition-all cursor-pointer font-medium ${!finalOnly ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                All rounds
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={handleSearch}
            disabled={!institute || dataLoading}
            loading={dataLoading}
            size="md"
          >
            <Search size={14} />
            {dataLoading ? 'Loading data…' : 'Explore Cutoffs'}
          </Button>
        </div>
      </Card>

      {/* Loading state */}
      {dataLoading && needsData && !hasSearched && (
        <div className="mt-6">
          <Spinner message="Loading full dataset for Cutoff Explorer…" />
        </div>
      )}

      {/* Results */}
      {hasSearched && results !== null && (
        <div className="mt-6">
          {/* Institute header */}
          {institute && (
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">{institute}</h2>
                  {typeColor && (
                    <Badge
                      label={meta.inst_type_map[institute]}
                      bg={typeColor.bg}
                      text={typeColor.text}
                      border={typeColor.border}
                      size="xs"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {results.length} cutoff record{results.length !== 1 ? 's' : ''} found
                  {finalOnly ? ' · Final round only' : ' · All rounds'}
                </p>
              </div>
            </div>
          )}

          {results.length === 0 ? (
            <Card>
              <EmptyState
                icon={TrendingUp}
                title="No cutoff data found"
                description="Try relaxing your filters — remove the category or quota restriction."
              />
            </Card>
          ) : (


            <Card padding={false} className="overflow-hidden rounded-2xl shadow-sm border border-gray-100">

              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Round</th>
                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Quota</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Opening</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Closing</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedResults.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-4 py-3">{row.year}</td>



                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          R{row.round}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          {row.category}
                        </span>
                      </td>


                      <td className="px-4 py-3">{row.gender}</td>


                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {row.quota}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatRank(row.opening_rank_raw)}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatRank(row.closing_rank_raw)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">

                <p className="text-xs text-gray-400">
                  {finalOnly ? 'Showing final round cutoffs for each year.' : 'Showing all rounds.'}
                  Source: JoSAA official data 2019–2025.
                </p>
              </div>

            </Card>

            



          )}
        </div>
      )}

      {/*<div className="premium-card">
        <div className="lock-badge">🔒</div>

        <h3>
          Scan karle boss,<br />
          future <span>thank you</span> bolega! 😎
        </h3>

        <div className="qr-wrapper">
          <img src="/qr.png" alt="Payment QR" />
        </div>

        <div className="price">
          Pay just <span>₹99</span>
        </div>

        <div className="unlock">
          🔒 to unlock Cutoff Explorer
        </div>

        <button
          className="paid-btn"
          onClick={() =>
            window.open(
              "YOUR_GOOGLE_FORM_LINK",
              "_blank"
            )
          }
        >
          ✅ I've Paid
        </button>

        <div className="missing-features">
          <h4>What you're missing 👀</h4>

          <ul>
            <li>📈 Year-over-year cutoff trends</li>
            <li>📊 Compare 2019 → 2025 instantly</li>
            <li>🎯 OPEN, OBC, SC, ST, EWS side-by-side</li>
            <li>🏛️ All IITs, NITs, IIITs & GFTIs</li>
            <li>🔍 Every branch, every category, every quota</li>
          </ul>
        </div>

        <div className="contribution">
          Every contribution unlocks one more
          <strong> "arre yeh bhi tha?!" </strong>
          feature ✨
        </div>
      </div>*/}




    {showPremium && (
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={() => setShowPremium(false)}
      >
        <div
          className="
            bg-white
            rounded-3xl
            max-w-[620px]
            w-[92%]
            p-6
            md:p-8
            relative
            max-h-[90vh]
            overflow-y-auto
          "
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowPremium(false)}
            className="
              absolute
              top-4
              right-4
              w-14
              h-14
              rounded-full
              bg-white
              shadow-lg
              flex
              items-center
              justify-center
              text-2xl
              font-light
              hover:scale-105
              transition
            "
          >
            ✕
          </button>

          <div className="lock-badge">🔒</div>

          <h2
            className="
              text-center
              text-3xl
              font-bold
              leading-tight
              mb-8
            "
          >
            Scan karle boss,
            <br />
            future thank you bolega! 😎
          </h2>
          <div className="missing-features">
            <h3
              className="
                text-lg
                font-semibold
                text-center
                mb-4
              "
            >
              What you're missing 👀
            </h3>

            <ul>
              <li>📈 Year-over-year cutoff trends</li>
              <li>📊 Compare 2019 → 2025 instantly</li>
              <li>🎯 OPEN, OBC, SC, ST, EWS side-by-side</li>
              <li>🏛️ All IITs, NITs, IIITs & GFTIs</li>
              <li>🔍 Every branch, every category, every quota</li>
            </ul>
          </div>

          <div className="qr-wrapper">
            <img src="/qr.png" alt="Payment QR" />
          </div>

          <div className="text-center my-6">
            <h2 className="text-4xl font-bold">
              Unlock for{" "}
              <span className="text-violet-500">
                ₹99
              </span>
            </h2>
          </div>



          <button
            className="paid-btn"
            onClick={() =>
              window.open(
                "https://forms.gle/XStR1fqvv32Hno2t5",
                "_blank"
              )
            }
          >
            ✅ I've Paid
          </button>

          <>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 border-t"></div>

              <span className="text-gray-500 text-sm">
                or
              </span>

              <div className="flex-1 border-t"></div>
            </div>

            <div className="pt-2">


            <p className="text-center text-gray-600 mb-3">
              Already have your personal access code?
            </p>

            <input
              type="text"
              placeholder="RM-XXXXXX-NAME"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm"
            />

            <button
              onClick={handleUnlock}
              className="w-full mt-3 rounded-xl bg-gray-900 text-white py-3 font-medium hover:bg-black transition"
            >
              Unlock Premium
            </button>
          </div>
          </>

          
          <div className="contribution">
            Every contribution unlocks one more
            <strong> "arre yeh bhi tha?!" </strong>
            feature ✨
          </div>
        </div>
      </div>
)}
    </div>
  );
}
