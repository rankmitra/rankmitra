/**
 * App.jsx
 * Root component. Handles mode switching (Predictor / Explorer) and top-level layout.
 */
import React, { useState } from 'react';
import { GraduationCap, TrendingUp, BookOpen } from 'lucide-react';
import { useMeta, useFinalData } from './hooks/useData';
import { predictColleges } from './utils/filters';
import PredictorForm from './components/predictor/PredictorForm';
import PredictorResults from './components/predictor/PredictorResults';
import Explorer from './components/explorer/Explorer';
import { Spinner } from './components/ui';

const MODES = [
  { id: 'predictor', label: 'College Predictor', icon: GraduationCap, description: 'Enter your rank → see matching colleges' },
  { id: 'explorer',  label: 'Cutoff Explorer',   icon: TrendingUp,    description: 'Browse cutoffs for any institute & branch' },
];

export default function App() {
  const [mode, setMode] = useState('predictor');
  const [searchParams, setSearchParams] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

  const { meta, loading: metaLoading } = useMeta();
  const { data: finalData, loading: dataLoading } = useFinalData();

  function handleSearch(params) {
    if (!finalData) return;
    setSearching(true);
    setSearchParams(params);
    requestAnimationFrame(() => {
      const res = predictColleges(finalData, params);
      setResults(res);
      setSearching(false);
    });
  }

  const isLoading = metaLoading || dataLoading;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold tracking-tight">
                RM
              </span>
            </div>
            <span className="font-semibold text-gray-900 text-sm tracking-tight">RankMitra 🇮🇳</span>
            <span className="hidden sm:inline text-gray-300 text-xs">·</span>
            <span className="hidden sm:inline text-gray-400 text-xs">JoSAA Counselling Platform</span>
          </div>
          {!isLoading && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <span className="text-xs text-gray-400">419,756 cutoff records · 2019–2025</span>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6 text-center">
        <div className="max-w-5xl">

          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Find the best college your rank can unlock
          </h1>

          <p className="text-gray-500 text-lg mt-4 max-w-3xl mx-auto">
            🇮🇳 Based on official JoSAA counselling data from 2019–2025.
            Analyze 419,756 cutoff records across 137 institutes and 319 programs.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                ✓ Official JoSAA Data
              </span>

              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ✓ 419,756 Records
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ✓ Updated for 2025
              </span>

              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                ✓ IIT • NIT • IIIT • GFTI
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-3 text-center">
              RankMitra helps students estimate admission chances using historical JoSAA counselling trends.
              Predictions are informational and should always be verified through official counselling portals.
            </p>
          </div>
        </div>
      </section>

      {/* Mode switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4">
        <div className="flex flex-col items-center">

          <div className="inline-flex bg-white rounded-2xl p-2 gap-2 shadow-md border border-gray-200">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setResults(null);
                  }}
                  className={[
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-gray-900 text-white shadow-md scale-[1.02]'
                      : 'text-gray-500 hover:text-gray-700',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            {MODES.find((m) => m.id === mode)?.description}
          </p>

        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {isLoading ? (
          <Spinner message="Loading JoSAA data…" />
        ) : (
          <>
            {mode === 'predictor' && (
              <>
                <PredictorForm meta={meta} onSearch={handleSearch} loading={searching} />
                <PredictorResults results={results} rank={searchParams?.rank} params={searchParams} />
              </>
            )}
            {mode === 'explorer' && <Explorer meta={meta} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">
                RM
              </span>
            </div>
            <span className="text-xs font-medium text-gray-700">RankMitra</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Data sourced from JoSAA official records · For informational purposes only</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Always verify on{' '}
              <a href="https://josaa.admissions.nic.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">josaa.admissions.nic.in</a>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Questions, suggestions, or feedback? Email us at{" "}
              <a
                href="mailto:rankmitraofficial@gmail.com"
                className="underline hover:no-underline"
              >
                rankmitraofficial@gmail.com
              </a>
            </p>
          </div>
          <p className="text-xs text-gray-300">Phase 1 · MVP</p>
        </div>
      </footer>
    </div>
  );
}
