import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Award, CheckCircle2, XCircle, Sparkles,
  Check, Loader2
} from 'lucide-react';
import { examService, Quiz, ExamResult } from '../../services/examService';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastProvider';

interface QuizTabProps {
  subjects: string[];
  units: string[];
}

export const QuizTab: React.FC<QuizTabProps> = ({ subjects, units }) => {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();

  const [selectedSubject, setSelectedSubject] = useState('DBMS');
  const [selectedUnit, setSelectedUnit] = useState('All Units');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<ExamResult | null>(null);

  const handleStartQuiz = async () => {
    setIsGenerating(true);
    info(`Generating GTU AI Quiz for ${selectedSubject}...`);
    try {
      const quiz = await examService.generateAIQuiz(selectedSubject, selectedUnit, 5);
      setActiveQuiz(quiz);
      setCurrentQIndex(0);
      setUserAnswers({});
      setTimeRemaining(quiz.durationMinutes * 60);
      setIsQuizSubmitted(false);
      setQuizScore(null);
      success("Quiz loaded! Good luck!");
    } catch {
      showError("Failed to generate quiz. Loading fallback set.");
      const fallback = examService.getFallbackQuiz(selectedSubject, selectedUnit);
      setActiveQuiz(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (isQuizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz || isQuizSubmitted) return;
    setIsQuizSubmitted(true);

    let correctCount = 0;
    activeQuiz.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) correctCount++;
    });

    const percentage = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const resultData: Omit<ExamResult, 'id' | 'timestamp'> = {
      studentId: user?.id || 'guest',
      studentName: user?.name || 'Student',
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      subject: activeQuiz.subject,
      score: correctCount,
      totalQuestions: activeQuiz.questions.length,
      percentage,
      timeSpentSeconds: activeQuiz.durationMinutes * 60 - timeRemaining,
      date: new Date().toISOString().split('T')[0] ?? ''
    };

    setQuizScore({ ...resultData, id: `res-${Date.now()}` });
    await examService.saveExamResult(resultData);
    success(`Quiz Submitted! You scored ${percentage}%`);
  };

  const handleQuizSubmitRef = useRef(handleQuizSubmit);
  handleQuizSubmitRef.current = handleQuizSubmit;

  useEffect(() => {
    if (!activeQuiz || isQuizSubmitted || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { handleQuizSubmitRef.current(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz?.id, isQuizSubmitted]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!activeQuiz) {
    return (
      <div role="tabpanel" className="flex flex-col gap-6 animate-fade-in">
        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 text-white shadow-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-stitch-primary" /> Dynamic GTU AI Quiz Generator
            </h2>
            <p className="text-slate-300 text-xs mt-1">Select your engineering subject and unit syllabus to generate a timed mock test.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Subject</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-stitch-primary outline-none text-white">
                {subjects.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Syllabus Unit</label>
              <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}
                className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-stitch-primary outline-none text-white">
                {units.map(u => <option key={u} value={u} className="bg-slate-900 text-white">{u}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleStartQuiz} disabled={isGenerating}
            className="stitch-btn w-full py-4 min-h-[44px] text-white rounded-2xl font-black font-display text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGenerating ? 'Generating GTU Questions...' : 'Start Timed Mock Quiz'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="tabpanel" className="flex flex-col gap-6 animate-fade-in">
      <div className="glass-card rounded-3xl border border-white/10 text-white shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 lg:p-6 bg-slate-950/80 text-white flex justify-between items-center border-b border-white/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stitch-primary block">{activeQuiz.subject}</span>
            <h3 className="text-base font-bold font-display text-white">{activeQuiz.title}</h3>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-mono font-black flex items-center gap-2 ${timeRemaining < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-stitch-cyan'}`}>
            <Clock className="w-4 h-4" /> {formatTime(timeRemaining)}
          </div>
        </div>

        {!isQuizSubmitted ? (
          <div className="p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
              <span>Progress: {Math.round(((currentQIndex + 1) / activeQuiz.questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-stitch-primary h-full transition-all duration-300"
                style={{ width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%` }}></div>
            </div>
            <h4 className="text-base lg:text-lg font-bold text-white leading-relaxed">
              {activeQuiz.questions[currentQIndex]?.question}
            </h4>
            <div className="flex flex-col gap-3">
              {activeQuiz.questions[currentQIndex]?.options.map((opt, oIdx) => {
                const isSelected = userAnswers[currentQIndex] === oIdx;
                return (
                  <button key={oIdx} onClick={() => handleSelectOption(currentQIndex, oIdx)}
                    className={`w-full min-h-[44px] text-left p-4 rounded-[16px] border text-sm font-medium flex items-center justify-between transition-all ${isSelected ? 'bg-stitch-primary-container/30 border-stitch-primary text-white shadow-[0_0_15px_rgba(67,56,202,0.2)]' : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'}`}>
                    <span>{opt}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-stitch-primary bg-stitch-primary text-white' : 'border-white/30'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))} disabled={currentQIndex === 0}
                className="px-5 py-2.5 min-h-[44px] bg-white/10 text-slate-200 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-white/20">Previous</button>
              {currentQIndex < activeQuiz.questions.length - 1 ? (
                <button onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="stitch-btn px-6 py-2.5 min-h-[44px] text-white rounded-[12px] text-xs font-bold">Next Question</button>
              ) : (
                <button onClick={handleQuizSubmit}
                  className="stitch-btn px-6 py-2.5 min-h-[44px] text-white rounded-[12px] text-xs font-bold">Submit Test</button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in">
            <div className="text-center bg-white/5 p-6 rounded-[24px] border border-white/10">
              <div className="w-16 h-16 bg-stitch-primary/20 text-stitch-primary rounded-full flex items-center justify-center mx-auto mb-3 border border-stitch-primary/30">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black font-display text-white">{quizScore?.percentage}% Score</h3>
              <p className="text-xs text-slate-300 mt-1">You answered {quizScore?.score} out of {quizScore?.totalQuestions} correctly.</p>
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Detailed Solution Key</h4>
            <div className="flex flex-col gap-4">
              {activeQuiz.questions.map((q, idx) => {
                const userAns = userAnswers[idx];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div key={q.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-2 text-white">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white">{idx + 1}. {q.question}</span>
                      {isCorrect ? (
                        <span className="px-2 py-0.5 bg-stitch-cyan/20 text-stitch-cyan font-bold border border-stitch-cyan/30 rounded-md flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3 h-3" /> Correct</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 font-bold border border-red-500/30 rounded-md flex items-center gap-1 shrink-0"><XCircle className="w-3 h-3" /> Wrong</span>
                      )}
                    </div>
                    <p className="text-slate-300">Your Answer: <strong className={isCorrect ? 'text-stitch-cyan' : 'text-red-400'}>{userAns !== undefined ? q.options[userAns] : 'Not Answered'}</strong></p>
                    <p className="text-stitch-cyan font-medium">Correct Answer: <strong>{q.options[q.correctAnswer]}</strong></p>
                    <div className="p-3 bg-[rgba(15,23,42,0.8)] border border-stitch-primary/20 rounded-xl text-slate-200 leading-relaxed">
                      AI Explanation: {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setActiveQuiz(null)}
              className="stitch-btn w-full py-3.5 min-h-[44px] text-white font-bold text-xs uppercase tracking-wider rounded-[12px]">
              Back to Quiz Selector
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
