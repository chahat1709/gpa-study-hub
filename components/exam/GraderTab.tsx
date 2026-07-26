import React, { useState } from 'react';
import { BrainCircuit, Upload, Loader2 } from 'lucide-react';
import { examService, WrittenEvaluationResult } from '../../services/examService';
import { useToast } from '../ToastProvider';

interface GraderTabProps {
  subjects: string[];
}

export const GraderTab: React.FC<GraderTabProps> = ({ subjects }) => {
  const { success, error: showError, info } = useToast();

  const [graderSubject, setGraderSubject] = useState('DBMS');
  const [graderQuestion, setGraderQuestion] = useState('Explain 3-Tier Database Architecture with block diagram and benefits.');
  const [studentTextAnswer, setStudentTextAnswer] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<WrittenEvaluationResult | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEvaluateWritten = async () => {
    if (!studentTextAnswer.trim() && !imagePreview) {
      showError("Please enter your answer text or upload an answer sheet image.");
      return;
    }
    setIsEvaluating(true);
    info("Evaluating answer sheet against GTU marking rubric...");
    try {
      const input = imagePreview || studentTextAnswer;
      const result = await examService.evaluateWrittenAnswer(graderSubject, graderQuestion, input, !!imagePreview);
      setEvaluationResult(result);
      success("Evaluation complete!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Evaluation failed.";
      showError(message);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div role="tabpanel" className="flex flex-col gap-6 animate-fade-in">
      <div className="glass-card p-6 rounded-3xl border border-white/10 text-white shadow-2xl flex flex-col gap-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" /> AI Written Answer Evaluator
          </h3>
          <p className="text-xs text-slate-300 mt-1">Upload a photo of your handwritten GTU answer sheet or paste text to evaluate against GTU rubric criteria.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Subject & Question</label>
            <select value={graderSubject} onChange={e => setGraderSubject(e.target.value)}
              className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-white">
              {subjects.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Question Text</label>
            <input type="text" value={graderQuestion} onChange={e => setGraderQuestion(e.target.value)} placeholder="Enter GTU question text..."
              className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Student Answer (Text Response)</label>
            <textarea value={studentTextAnswer} onChange={e => setStudentTextAnswer(e.target.value)} placeholder="Type or paste your answer paragraphs here..."
              className="w-full h-32 p-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">OR Upload Handwritten Answer Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="answer-img-upload" />
            <label htmlFor="answer-img-upload" className="w-full p-4 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
              <Upload className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300">Click to upload photo of answer sheet</span>
            </label>
            {imagePreview && (
              <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-white/20">
                <img src={imagePreview} className="w-full h-full object-cover" alt="Answer Preview" />
              </div>
            )}
          </div>
          <button onClick={handleEvaluateWritten} disabled={isEvaluating}
            className="w-full py-4 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50">
            {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
            {isEvaluating ? 'Evaluating Answer Sheet...' : 'Grade Answer Against GTU Rubric'}
          </button>
        </div>
      </div>

      {evaluationResult && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 text-white shadow-2xl flex flex-col gap-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">GTU Evaluation Score</span>
              <h4 className="text-2xl font-black text-white">{evaluationResult.overallScore} / 100</h4>
            </div>
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
              GTU Grade: {evaluationResult.overallScore >= 80 ? 'AA (Outstanding)' : evaluationResult.overallScore >= 60 ? 'BB (Good)' : 'CC (Needs Improvement)'}
            </div>
          </div>
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">GTU Rubric Breakdown</h5>
            <div className="space-y-2">
              {[
                { label: 'Keywords & Terminology (30%)', value: evaluationResult.breakdown.keywords, max: 30 },
                { label: 'Concept Clarity & Structure (40%)', value: evaluationResult.breakdown.conceptClarity, max: 40 },
                { label: 'Technical Accuracy & Precision (30%)', value: evaluationResult.breakdown.technicalAccuracy, max: 30 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold text-indigo-400">{item.value} / {item.max}</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${(item.value / item.max) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl text-xs space-y-2">
            <h5 className="font-bold text-indigo-300 uppercase tracking-wider">Ideal GTU Model Answer</h5>
            <p className="text-slate-200 leading-relaxed">{evaluationResult.modelAnswer}</p>
          </div>
        </div>
      )}
    </div>
  );
};
