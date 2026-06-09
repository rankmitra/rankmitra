/**
 * PredictorForm.jsx
 * Input form for College Predictor mode.
 */
import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Info } from 'lucide-react';
import { Select, TextInput, Button, TogglePill, Card } from '../ui';

const INSTITUTE_TYPES = ['IIT', 'NIT', 'IIIT', 'GFTI'];

export default function PredictorForm({ meta, onSearch, loading }) {
  const currentYear = meta?.years?.at(-1) ?? 2024;

  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('OPEN');
  const [gender, setGender] = useState('Gender-Neutral');
  const [quota, setQuota] = useState('AI');
  const [year, setYear] = useState(String(currentYear));
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const yearOptions = useMemo(() => (meta?.years ?? []).map((y) => ({
    value: String(y), label: String(y),
  })).reverse(), [meta]);

  const categoryOptions = useMemo(() => (meta?.categories ?? []).map((c) => ({
    value: c,
    label: meta?.category_descriptions?.[c] ? `${c} — ${meta.category_descriptions[c]}` : c,
  })), [meta]);

  const quotaOptions = useMemo(() => (meta?.quotas ?? []).map((q) => ({
    value: q,
    label: meta?.quota_descriptions?.[q] ? `${q} — ${meta.quota_descriptions[q]}` : q,
  })), [meta]);

  const genderOptions = [
    { value: 'Gender-Neutral', label: 'All genders (Gender-Neutral seats)' },
    { value: 'Female-only (including Supernumerary)', label: 'Female — show all eligible seats' },
  ];

  function toggleType(t) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function handleSubmit() {
    const rankNum = parseInt(rank, 10);
    if (!rankNum || rankNum < 1) return;
    onSearch({
      rank: rankNum,
      category,
      gender,
      quota,
      year: parseInt(year, 10),
      instituteTypes: selectedTypes,
    });
  }

  const rankValid = rank && parseInt(rank, 10) > 0;

  return (
    <Card className="w-full">
      {/* Primary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TextInput
          label="Your JEE Rank"
          value={rank}
          onChange={setRank}
          placeholder="e.g. 12500"
          type="number"
          hint="Enter your CRL / category rank"
        />






        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Category
            </label>

            <button
              type="button"
              title="Reservation category used for counselling"
              className="text-gray-400 hover:text-gray-600"
            >
              <Info size={14} />
            </button>
          </div>

          <Select
            label=""
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
        </div>



        <Select
          label="Quota"
          value={quota}
          onChange={setQuota}
          options={quotaOptions}
        />
        <Select
          label="Year"
          value={year}
          onChange={setYear}
          options={yearOptions}
          hint="Cutoff data year"
        />
      </div>

      {/* Gender + institute type row */}
      <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1">
          <Select
            label="Gender"
            value={gender}
            onChange={setGender}
            options={genderOptions}
          />
        </div>

        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Institute Type <span className="normal-case font-normal text-gray-400">(all if none selected)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {INSTITUTE_TYPES.map((t) => (
              <TogglePill
                key={t}
                label={t}
                active={selectedTypes.includes(t)}
                onClick={() => toggleType(t)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Search button */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <SlidersHorizontal size={12} />
          {showAdvanced ? 'Hide advanced' : 'Advanced filters'}
        </button>

        <Button
          onClick={handleSubmit}
          disabled={!rankValid}
          loading={loading}
          size="md"
        >
          <Search size={14} />
          Find Colleges
        </Button>
      </div>

      {/* Advanced — placeholder for Phase 2 branch filter */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center py-2">
            Branch filtering, PwD seat toggle, and female-only seat toggle coming in Phase 2.
          </p>
        </div>
      )}
    </Card>
  );
}
