/**
 * PredictorResults.jsx
 * Displays college predictor results with Safe / Match / Reach classification.
 */
import React, { useMemo, useState, useRef } from 'react';
import { GraduationCap, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge, EmptyState, TogglePill, Card } from '../ui';
import { classifyResult, formatRank, shortProgram, TYPE_COLORS, CLASS_COLORS } from '../../utils/filters';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const CLASS_ORDER = { safe: 0, match: 1, reach: 2, unknown: 3 };

export default function PredictorResults({ results, rank, params }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'safe' | 'match' | 'reach'
  const [sortCol, setSortCol] = useState('closing_rank_int');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const pdfRef = useRef(null);


  const exportPDF = async () => {
    try {


      const dataUrl = await toPng(pdfRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        skipFonts: true,
      });




      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();

      const imgProps = pdf.getImageProperties(dataUrl);

      const imgWidth = pdfWidth;

      const imgHeight =
        (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(
          dataUrl,
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );

        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`RankMitra_${rank}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };


  const classified = useMemo(() => {
  if (!results || !rank) return [];

  return results.map((row) => {
    const classification = classifyResult(row, rank);

    let chance = 0;

    if (row.closing_rank_int) {
      const ratio = rank / row.closing_rank_int;

      if (ratio <= 0.70) chance = 95;
      else if (ratio <= 0.85) chance = 85;
      else if (ratio <= 1.00) chance = 70;
      else if (ratio <= 1.15) chance = 40;
      else chance = 15;
    }

    return {
      ...row,
      classification,
      chance,
      programShort: shortProgram(row.program),
    };
  });
}, [results, rank]);


  const counts = useMemo(() => {
    const c = { safe: 0, match: 0, reach: 0 };
    classified.forEach((r) => { if (c[r.classification] !== undefined) c[r.classification]++; });
    return c;
  }, [classified]);

  const filtered = useMemo(() => {
    let rows =
      activeFilter === 'all'
        ? classified
        : classified.filter((r) => r.classification === activeFilter);

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();

      rows = rows.filter(
        (r) =>
          r.institute?.toLowerCase().includes(q) ||
          r.program?.toLowerCase().includes(q) ||
          r.institute_state?.toLowerCase().includes(q)
      );
    }

    rows = [...rows].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (av == null) av = Infinity;
      if (bv == null) bv = Infinity;
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? av - bv : bv - av;
    });

    return rows;
  }, [classified, activeFilter, sortCol, sortAsc, searchTerm]);

  function handleSort(col) {
    if (sortCol === col) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(true); }
  }

  if (!results) return null;

  if (results.length === 0) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon={GraduationCap}
          title="No colleges found for this combination"
          description="Try relaxing your filters — broaden institute types, check the quota, or try a different year."
        />
      </Card>
    );
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronUp size={12} className="text-gray-300" />;
    return sortAsc
      ? <ChevronUp size={12} className="text-gray-600" />
      : <ChevronDown size={12} className="text-gray-600" />;
  };

  const Th = ({ col, children, className = '' }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none whitespace-nowrap ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    
  <div className="mt-6" ref={pdfRef}>
      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{results.length}</span> college-branch combinations found
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <TogglePill label={`All (${results.length})`} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <TogglePill label={`✓ Safe (${counts.safe})`} active={activeFilter === 'safe'} onClick={() => setActiveFilter('safe')} />
          <TogglePill label={`≈ Match (${counts.match})`} active={activeFilter === 'match'} onClick={() => setActiveFilter('match')} />
            
          <TogglePill label={`↑ Reach (${counts.reach})`} active={activeFilter === 'reach'} onClick={() => setActiveFilter('reach')} />

            {/*<button
                onClick={exportPDF}
                
                className="ml-auto px-4 py-2 text-sm bg-gray-900 text-white rounded-xl"
              >
                Export PDF
              </button>*/}

        </div>


      </div>

      {/* Legend + Explanation */}

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search institute, branch or state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          How RankMitra predicts your chances
        </h3>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="font-semibold text-green-800">Safe</span>
            </div>
            <p className="text-green-700 text-xs leading-relaxed">
              Your rank is comfortably better than previous closing ranks.
              These are your strongest admission opportunities.
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="font-semibold text-blue-800">Match</span>
            </div>
            <p className="text-blue-700 text-xs leading-relaxed">
              Your rank is close to historical cutoffs.
              Admission is possible but competition is higher.
            </p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
            
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="font-semibold text-orange-800">Reach</span>
            </div>
            <p className="text-orange-700 text-xs leading-relaxed">
              These are ambitious choices.
              Historical cutoffs are slightly stronger than your rank.
            </p>

          </div>

        </div>
      </div>

      {/* Table */}
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-6">#</th>
                <Th col="classification">Chance</Th>
                <Th col="institute">Institute</Th>
                <Th col="institute_type">Type</Th>
                <Th col="programShort">Branch</Th>
                <Th col="category">Category</Th>
                <Th col="quota">Quota</Th>
                <Th col="opening_rank_int">Opening</Th>
                <Th col="closing_rank_int">Closing</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row, i) => {
                const typeColor = TYPE_COLORS[row.institute_type] ?? TYPE_COLORS.GFTI;
                const classColor = CLASS_COLORS[row.classification] ?? CLASS_COLORS.unknown;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-300 text-xs">{i + 1}</td>



                    <td className="px-3 py-3 min-w-[140px]">
                      <div className="space-y-1">

                        <Badge
                          label={classColor.label}
                          bg={classColor.bg}
                          text={classColor.text}
                          border={classColor.border}
                        />

                        <div className="text-xs font-semibold text-gray-700">
                          {row.chance}%
                        </div>

                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              row.chance >= 80
                                ? 'bg-green-500'
                                : row.chance >= 60
                                ? 'bg-yellow-400'
                                : row.chance >= 40
                                ? 'bg-orange-400'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${row.chance}%` }}
                          />
                        </div>

                      </div>
                    </td>




                    <td className="px-3 py-3 min-w-[260px]">



                      <p className="font-medium text-gray-900 text-xs leading-tight break-words">
                        {row.institute}
                        {row.institute_state && (
                          <>
                            <br />
                            <span className="text-gray-400 text-[10px] font-normal">
                              {row.institute_state}
                            </span>
                          </>
                        )}
                      </p>
                       




                    </td>




                    <td className="px-3 py-3">
                      <Badge
                        label={row.institute_type}
                        bg={typeColor.bg}
                        text={typeColor.text}
                        border={typeColor.border}
                        size="xs"
                      />
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <p className="text-gray-700 text-xs leading-tight" title={row.program}>
                        {row.programShort}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{row.category}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{row.quota}</td>
                    <td className="px-3 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">
                      {row.opening_is_pwd ? `${row.opening_rank_raw}` : formatRank(row.opening_rank_int)}
                    </td>
                    <td className="px-3 py-3 text-xs font-mono font-semibold text-gray-900 whitespace-nowrap">
                      {row.closing_is_pwd ? `${row.closing_rank_raw}` : formatRank(row.closing_rank_int)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {results.length} results
            {params && ` · Year ${params.year} · Final round cutoffs`}
          </p>
          <p className="text-xs text-gray-400">
            Data: JoSAA 2019–2025
          </p>
        </div>
      </Card>
    </div>
  );
}
