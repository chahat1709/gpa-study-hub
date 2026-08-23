import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Loader2 } from 'lucide-react';
import { examService } from '../../services/examService';
import { useToast } from '../ToastProvider';

const pastPapersList = [
  {
    id: '1',
    title: 'DBMS GTU End-Sem Paper',
    year: 'Winter 2024',
    subject: 'DBMS',
    code: '3140705',
  },
  {
    id: '2',
    title: 'Cyber Security GTU End-Sem',
    year: 'Summer 2024',
    subject: 'CYBER SEC',
    code: '3140706',
  },
  {
    id: '3',
    title: 'Advance Python Programming GTU',
    year: 'Winter 2023',
    subject: 'AD PYTHON',
    code: '3140707',
  },
  {
    id: '4',
    title: 'Embedded Systems GTU End-Sem',
    year: 'Summer 2023',
    subject: 'ES',
    code: '3140708',
  },
];

export const PapersTab: React.FC = () => {
  const { success, error: showError, info } = useToast();
  const [paperYear, setPaperYear] = useState('Winter 2024');
  const [activeSolutionKey, setActiveSolutionKey] = useState<string | null>(null);
  const [isSolutionLoading, setIsSolutionLoading] = useState(false);

  const handleLoadSolutionKey = async (paperTitle: string, paperSubject: string) => {
    setIsSolutionLoading(true);
    setActiveSolutionKey(null);
    try {
      info(`Generating GTU AI Solution Key for ${paperTitle}...`);
      const solution = await examService.getAIQuestionSolution(paperTitle, paperSubject);
      setActiveSolutionKey(solution);
      success('GTU Solution Key loaded!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate solution key.';
      showError(message);
    } finally {
      setIsSolutionLoading(false);
    }
  };

  return (
    <div role="tabpanel" className="flex flex-col gap-6 animate-fade-in">
      <div className="glass-card p-6 rounded-3xl border border-white/10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-white">GTU Previous Year Papers Vault</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Access official GTU examination papers with instant step-by-step AI solution keys.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-300">Filter Year:</label>
          <select
            value={paperYear}
            onChange={e => setPaperYear(e.target.value)}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none"
          >
            <option value="Winter 2024" className="bg-slate-900 text-white">
              Winter 2024
            </option>
            <option value="Summer 2024" className="bg-slate-900 text-white">
              Summer 2024
            </option>
            <option value="Winter 2023" className="bg-slate-900 text-white">
              Winter 2023
            </option>
            <option value="Summer 2023" className="bg-slate-900 text-white">
              Summer 2023
            </option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pastPapersList.map(paper => (
          <div
            key={paper.id}
            className="glass-card p-5 rounded-2xl border border-white/10 text-white shadow-2xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="px-2.5 py-0.5 bg-stitch-primary/20 border border-stitch-primary/30 text-stitch-primary font-bold text-[10px] rounded-md uppercase">
                  {paper.subject}
                </span>
                <span className="text-slate-400 text-xs font-medium">{paper.year}</span>
              </div>
              <h4 className="text-sm font-bold font-display text-white">{paper.title}</h4>
              <p className="text-xs text-slate-400 font-mono mt-1">Paper Code: {paper.code}</p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => handleLoadSolutionKey(paper.title, paper.subject)}
                className="stitch-btn flex-1 py-3 min-h-[44px] text-white rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Solution Key
              </button>
            </div>
          </div>
        ))}
      </div>

      {(isSolutionLoading || activeSolutionKey) && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 text-white shadow-2xl animate-fade-in space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold font-display text-stitch-cyan flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-stitch-cyan" /> GTU Verified Solution Guide
            </h4>
            <button
              onClick={() => setActiveSolutionKey(null)}
              className="text-xs font-bold text-slate-400 hover:text-white p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Close
            </button>
          </div>
          {isSolutionLoading ? (
            <div className="flex items-center justify-center py-8 text-stitch-cyan gap-2 text-xs font-bold">
              <Loader2 className="w-5 h-5 animate-spin" /> Generating Step-by-Step GTU Solution...
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 whitespace-pre-line font-medium bg-white/5 p-4 rounded-2xl border border-white/10">
              {activeSolutionKey}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
