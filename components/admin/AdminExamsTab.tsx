import React from 'react';
import { GraduationCap, Sparkles, Trash2, Search, Loader2, Users } from 'lucide-react';
import { Quiz, QuizQuestion, ExamResult } from '../../services/examService';

interface AdminExamsTabProps {
  subjects: string[];
  pubTitle: string;
  setPubTitle: (v: string) => void;
  pubSubject: string;
  setPubSubject: (v: string) => void;
  pubUnit: string;
  setPubUnit: (v: string) => void;
  pubDuration: number;
  setPubDuration: (v: number) => void;
  pubQuestions: QuizQuestion[];
  setPubQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
  isGeneratingQuiz: boolean;
  isPublishingQuiz: boolean;
  onGenerateAI: () => void;
  onPublish: (e: React.FormEvent) => void;
  publishedQuizzes: Quiz[];
  onDeleteQuiz: (id: string) => void;
  classOverview: {
    classReadinessIndex: number;
    readinessStatus: string;
    totalSubmissions: number;
    avgPercentage: number;
    passRate: number;
    topSubject: string;
  };
  gradebookSearch: string;
  setGradebookSearch: (v: string) => void;
  gradebookSubjectFilter: string;
  setGradebookSubjectFilter: (v: string) => void;
  filteredGradebook: ExamResult[];
  qText: string;
  setQText: (v: string) => void;
  qOpt0: string;
  setQOpt0: (v: string) => void;
  qOpt1: string;
  setQOpt1: (v: string) => void;
  qOpt2: string;
  setQOpt2: (v: string) => void;
  qOpt3: string;
  setQOpt3: (v: string) => void;
  qCorrect: number;
  setQCorrect: (v: number) => void;
  qExplanation: string;
  setQExplanation: (v: string) => void;
  onAddQuestion: (e: React.FormEvent) => void;
}

export const AdminExamsTab: React.FC<AdminExamsTabProps> = ({
  subjects,
  pubTitle,
  setPubTitle,
  pubSubject,
  setPubSubject,
  pubUnit,
  setPubUnit,
  pubDuration,
  setPubDuration,
  pubQuestions,
  setPubQuestions,
  isGeneratingQuiz,
  isPublishingQuiz,
  onGenerateAI,
  onPublish,
  publishedQuizzes,
  onDeleteQuiz,
  classOverview,
  gradebookSearch,
  setGradebookSearch,
  gradebookSubjectFilter,
  setGradebookSubjectFilter,
  filteredGradebook,
  qText,
  setQText,
  qOpt0,
  setQOpt0,
  qOpt1,
  setQOpt1,
  qOpt2,
  setQOpt2,
  qOpt3,
  setQOpt3,
  qCorrect,
  setQCorrect,
  qExplanation,
  setQExplanation,
  onAddQuestion,
}) => (
  <div className="space-y-6 lg:space-y-8 animate-fade-in">
    {/* Readiness Overview */}
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-[32px] lg:rounded-[40px] p-6 lg:p-10 text-white shadow-2xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[90px] -mr-16 -mt-16 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold">
            <GraduationCap className="w-4 h-4" /> GTU Class Analytics & Gradebook
          </div>
          <h2 className="text-2xl lg:text-4xl font-black tracking-tight">
            Class GTU Readiness Overview
          </h2>
          <p className="text-xs lg:text-sm text-slate-300 max-w-xl font-medium">
            Faculty exam publishing control panel and real-time student GTU exam performance
            analytics.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex items-center gap-5 shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="5"
                className="text-white/20"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="5"
                className="text-emerald-400"
                fill="transparent"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * classOverview.classReadinessIndex) / 100}
              />
            </svg>
            <span className="absolute text-sm font-black">
              {classOverview.classReadinessIndex}%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              Overall Readiness
            </p>
            <p className="text-base font-black text-white">{classOverview.readinessStatus}</p>
            <p className="text-xs text-slate-300 font-medium">
              {classOverview.totalSubmissions} Student Submissions
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Class Average
          </p>
          <p className="text-xl lg:text-2xl font-black text-emerald-400 mt-0.5">
            {classOverview.avgPercentage}%
          </p>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pass Rate (≥60%)
          </p>
          <p className="text-xl lg:text-2xl font-black text-indigo-300 mt-0.5">
            {classOverview.passRate}%
          </p>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Top Subject
          </p>
          <p className="text-xl lg:text-2xl font-black text-amber-300 mt-0.5 truncate">
            {classOverview.topSubject}
          </p>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Published Exams
          </p>
          <p className="text-xl lg:text-2xl font-black text-white mt-0.5">
            {publishedQuizzes.length}
          </p>
        </div>
      </div>
    </div>

    {/* Two-column: Publisher + Gradebook */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      {/* Publisher */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-card bg-slate-900/60 rounded-[32px] border border-white/10 p-6 lg:p-8 shadow-sm flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Publish Exam Paper</h3>
                <p className="text-xs text-slate-400 font-medium">Create GTU test for students</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGenerateAI}
              disabled={isGeneratingQuiz}
              className="px-3 py-2 min-h-[44px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isGeneratingQuiz ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>AI Auto-Build</span>
            </button>
          </div>

          <form onSubmit={onPublish} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Exam Title
              </label>
              <input
                type="text"
                value={pubTitle}
                onChange={e => setPubTitle(e.target.value)}
                placeholder="e.g. DBMS Unit 2 Mid-Sem Assessment"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Subject
                </label>
                <select
                  value={pubSubject}
                  onChange={e => setPubSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  {subjects.map(s => (
                    <option key={s} value={s} className="bg-slate-900 text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={pubDuration}
                  onChange={e => setPubDuration(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Syllabus Unit
              </label>
              <input
                type="text"
                value={pubUnit}
                onChange={e => setPubUnit(e.target.value)}
                placeholder="e.g. Unit 1: Fundamentals"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Question Builder */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Question Builder ({pubQuestions.length})
                </span>
                {pubQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPubQuestions([])}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase"
                  >
                    Clear Questions
                  </button>
                )}
              </div>
              <input
                type="text"
                value={qText}
                onChange={e => setQText(e.target.value)}
                placeholder="Enter question text..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={qOpt0}
                  onChange={e => setQOpt0(e.target.value)}
                  placeholder="Option A"
                  className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs outline-none"
                />
                <input
                  value={qOpt1}
                  onChange={e => setQOpt1(e.target.value)}
                  placeholder="Option B"
                  className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs outline-none"
                />
                <input
                  value={qOpt2}
                  onChange={e => setQOpt2(e.target.value)}
                  placeholder="Option C"
                  className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs outline-none"
                />
                <input
                  value={qOpt3}
                  onChange={e => setQOpt3(e.target.value)}
                  placeholder="Option D"
                  className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[11px] font-bold text-slate-400 shrink-0">
                  Correct Answer:
                </label>
                <select
                  value={qCorrect}
                  onChange={e => setQCorrect(Number(e.target.value))}
                  className="bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1 text-xs font-bold outline-none"
                >
                  <option value={0} className="bg-slate-900 text-white">
                    Option A
                  </option>
                  <option value={1} className="bg-slate-900 text-white">
                    Option B
                  </option>
                  <option value={2} className="bg-slate-900 text-white">
                    Option C
                  </option>
                  <option value={3} className="bg-slate-900 text-white">
                    Option D
                  </option>
                </select>
              </div>
              <input
                type="text"
                value={qExplanation}
                onChange={e => setQExplanation(e.target.value)}
                placeholder="GTU Explanation / Reference..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
              <button
                type="button"
                onClick={onAddQuestion}
                className="w-full py-3 min-h-[44px] bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors flex items-center justify-center"
              >
                Add Question to Paper
              </button>
            </div>

            {pubQuestions.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {pubQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs flex justify-between items-start gap-2"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {idx + 1}. {q.question}
                      </p>
                      <p className="text-emerald-400 text-[11px] font-medium mt-0.5">
                        Ans: {q.options[q.correctAnswer]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPubQuestions(prev => prev.filter(x => x.id !== q.id))}
                      className="text-slate-400 hover:text-rose-400 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isPublishingQuiz}
              className="w-full py-3.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPublishingQuiz ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GraduationCap className="w-4 h-4" />
              )}
              <span>Publish Official Quiz</span>
            </button>
          </form>
        </div>

        {/* Published Exams List */}
        <div className="glass-card bg-slate-900/60 rounded-[32px] border border-white/10 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="font-bold text-white text-sm">Published Campus Exams</h4>
            <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded text-xs font-bold">
              {publishedQuizzes.length}
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
            {publishedQuizzes.map(quiz => (
              <div
                key={quiz.id}
                className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center hover:bg-white/10 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold text-[10px] rounded uppercase">
                      {quiz.subject}
                    </span>
                    <span className="text-slate-400 text-[11px] font-medium">
                      • {quiz.durationMinutes} mins
                    </span>
                  </div>
                  <h5 className="font-bold text-white text-xs">{quiz.title}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {quiz.questions.length} questions • Created by {quiz.createdBy || 'Faculty'}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteQuiz(quiz.id)}
                  className="p-3 min-h-[44px] min-w-[44px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {publishedQuizzes.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No active published exams.</p>
            )}
          </div>
        </div>
      </div>

      {/* Gradebook */}
      <div className="lg:col-span-7 glass-card bg-slate-900/60 rounded-[32px] border border-white/10 p-6 lg:p-8 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h3 className="font-bold text-white text-lg">Student Gradebook Analytics</h3>
            <p className="text-xs text-slate-400 font-medium">
              Exam attempt logs & student GTU readiness scores
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={gradebookSearch}
                onChange={e => setGradebookSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
            <select
              value={gradebookSubjectFilter}
              onChange={e => setGradebookSubjectFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                All Subjects
              </option>
              {subjects.map(s => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto flex-1 mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Test Title</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3 text-center">Percentage</th>
                <th className="py-3 px-3 text-center">Time Spent</th>
                <th className="py-3 px-3 text-center">GTU Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs font-medium text-slate-300">
              {filteredGradebook.map(row => {
                const gtuReadiness = Math.min(99, Math.round(row.percentage * 0.9 + 5));
                return (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-white">{row.studentName}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase text-slate-300">
                        {row.subject}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 max-w-[150px] truncate text-slate-300">
                      {row.quizTitle}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-white">
                      {row.score}/{row.totalQuestions}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                          row.percentage >= 80
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : row.percentage >= 60
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                      {Math.floor(row.timeSpentSeconds / 60)}m {row.timeSpentSeconds % 60}s
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          gtuReadiness >= 75
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {gtuReadiness}% Ready
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredGradebook.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No student submissions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
