import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getCurrentApiKey, getGeminiApiKey } from "./aiProviderService";
import { getAcademicSubjects, getAcademicQuestions, AcademicSubject } from "./apiClient";
import { db, isConfigValid } from "../firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { offlineStorageService } from "./offlineStorageService";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
  unit?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  unit?: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  isOfficial?: boolean;
  createdBy?: string; // Faculty name/ID
  createdAt?: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  date: string;
  timestamp?: string;
}

export interface WrittenEvaluationResult {
  overallScore: number; // Out of 100
  breakdown: {
    keywords: number; // 30%
    conceptClarity: number; // 40%
    technicalAccuracy: number; // 30%
  };
  strengths: string[];
  weaknesses: string[];
  modelAnswer: string;
  recommendations: string;
}

const STORAGE_KEY_RESULTS = 'GPA_HUB_EXAM_RESULTS';
const STORAGE_KEY_QUIZZES = 'GPA_HUB_OFFICIAL_QUIZZES';
const STORAGE_KEY_PAPER_SOLUTIONS = 'GPA_HUB_PAPER_SOLUTIONS';

export const examService = {
  /**
   * DYNAMIC AI QUIZ GENERATION
   * Generates custom MCQ quizzes using Gemini 3 Pro with structured JSON output.
   */
  generateAIQuiz: async (subject: string, unit: string = 'All Units', count: number = 5): Promise<Quiz> => {
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        const bankQuiz = await examService.generateBankQuiz(subject, unit, count);
        return bankQuiz || examService.getFallbackQuiz(subject, unit);
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are a GTU (Gujarat Technological University) Senior Exam Paper Setter for ${subject}.
        Generate a multiple-choice quiz of ${count} high-quality questions for ${unit === 'All Units' ? 'the full syllabus' : unit}.
        
        Return STRICT JSON only matching this exact format without extra text or markdown syntax wrappers:
        {
          "title": "${subject} - ${unit} Mock Test",
          "durationMinutes": ${Math.max(5, count * 2)},
          "questions": [
            {
              "id": "q1",
              "question": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Detailed step-by-step reason for the correct answer."
            }
          ]
        }
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 2048 }
        }
      });

      const rawText = response.text || '';
      // Clean JSON if markdown ticks present
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        id: `ai-quiz-${Date.now()}`,
        title: parsed.title || `${subject} AI Quiz`,
        subject,
        unit,
        durationMinutes: parsed.durationMinutes || 10,
        questions: parsed.questions || [],
        isOfficial: false,
        createdAt: Date.now()
      };
    } catch {
      const bankQuiz = await examService.generateBankQuiz(subject, unit, count);
      return bankQuiz || examService.getFallbackQuiz(subject, unit);
    }
  },

  /**
   * RESOLVE SUBJECT ID FROM THE GTU SUBJECT CATALOG (by code/name match)
   */
  resolveSubjectId: async (subject: string): Promise<string | null> => {
    try {
      const { subjects } = await getAcademicSubjects();
      const needle = subject.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      let match: AcademicSubject | null = null;
      for (const s of subjects) {
        const hay = `${s.code} ${s.name}`.toLowerCase();
        if (needle && hay.includes(needle)) {
          match = s;
          break;
        }
      }
      return match ? match.id : null;
    } catch {
      return null;
    }
  },

  /**
   * GTU QUESTION BANK QUIZ
   * Builds a quiz from real seeded question_banks MCQs (server-backed).
   * Returns null when the server/bank is unavailable, letting callers fall back.
   */
  generateBankQuiz: async (subject: string, unit: string = 'All Units', count: number = 5): Promise<Quiz | null> => {
    try {
      const subjectId = await examService.resolveSubjectId(subject);
      if (!subjectId) return null;

      const { questions } = await getAcademicQuestions({ subjectId, type: 'MCQ', limit: count });
      if (!questions.length) return null;

      const quizQuestions: QuizQuestion[] = [];
      for (const q of questions) {
        let opts: string[] = [];
        try { opts = JSON.parse(q.options || '[]'); } catch { opts = []; }
        if (!Array.isArray(opts) || opts.length < 2) continue;
        const correctIndex = opts.indexOf(q.correct_answer);
        if (correctIndex === -1) continue;
        quizQuestions.push({
          id: q.id,
          question: q.question_text,
          options: opts,
          correctAnswer: correctIndex,
          explanation: q.explanation || '',
          unit: unit === 'All Units' ? undefined : unit,
        });
      }
      if (quizQuestions.length < 2) return null;

      return {
        id: `bank-quiz-${Date.now()}`,
        title: `${subject} — GTU Question Bank`,
        subject,
        unit,
        durationMinutes: Math.max(5, quizQuestions.length * 2),
        questions: quizQuestions,
        isOfficial: true,
        createdBy: 'GTU Exam Cell',
        createdAt: Date.now()
      };
    } catch {
      return null;
    }
  },

  /**
   * AI WRITTEN ANSWER EVALUATION (GTU RUBRIC)
   * Multi-modal image/text evaluation against GTU marking criteria.
   */
  evaluateWrittenAnswer: async (
    subject: string,
    questionText: string,
    studentInput: string, // Text or Base64 Image
    isImage: boolean = false
  ): Promise<WrittenEvaluationResult> => {
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error("Gemini API Key is missing. Please configure your API key in Settings.");

      const ai = new GoogleGenAI({ apiKey });
      const rubricPrompt = `
        You are a GTU Evaluator grading an engineering answer sheet.
        Subject: ${subject}
        Question: "${questionText}"
        
        Evaluate the student's submission using the GTU Assessment Rubric:
        1. Keywords & Technical Terminology (30% weight, max 30)
        2. Core Concept Clarity & Structure (40% weight, max 40)
        3. Technical Accuracy & Precision (30% weight, max 30)

        Return STRICT JSON only matching this format:
        {
          "breakdown": {
            "keywords": 26,
            "conceptClarity": 34,
            "technicalAccuracy": 25
          },
          "strengths": ["Clear diagram description", "Used correct GTU formulas"],
          "weaknesses": ["Missed definition of term X"],
          "modelAnswer": "Model solution paragraph explaining the ideal GTU answer.",
          "recommendations": "Advice on how to score full marks in GTU end-sem exam."
        }
      `;

      let contents: any;
      if (isImage) {
        const mimeMatch = studentInput.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64Data = studentInput.replace(/^data:image\/\w+;base64,/, "");
        contents = {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: rubricPrompt }
          ]
        };
      } else {
        contents = `${rubricPrompt}\n\nStudent Written Answer:\n"${studentInput}"`;
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents,
        config: {
          thinkingConfig: { thinkingBudget: 2048 }
        }
      });

      const cleanJson = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const rawBreakdown = parsed.breakdown || {};
      const keywords = Math.min(30, Math.max(0, Math.round(Number(rawBreakdown.keywords) || 0)));
      const conceptClarity = Math.min(40, Math.max(0, Math.round(Number(rawBreakdown.conceptClarity) || 0)));
      const technicalAccuracy = Math.min(30, Math.max(0, Math.round(Number(rawBreakdown.technicalAccuracy) || 0)));
      const overallScore = Math.min(100, Math.max(0, keywords + conceptClarity + technicalAccuracy));

      return {
        overallScore,
        breakdown: {
          keywords,
          conceptClarity,
          technicalAccuracy
        },
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        modelAnswer: parsed.modelAnswer || '',
        recommendations: parsed.recommendations || ''
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * SAVE EXAM RESULTS (Firebase + Local Storage Fallback)
   */
  saveExamResult: async (result: Omit<ExamResult, 'id' | 'timestamp'>) => {
    const fullResult: ExamResult = {
      ...result,
      id: `res-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    if (isConfigValid && db) {
      try {
        await addDoc(collection(db, 'exam_results'), {
          ...fullResult,
          timestamp: serverTimestamp()
        });
      } catch {
        offlineStorageService.enqueue('EXAM_SUBMISSION', fullResult);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
    const results: ExamResult[] = saved ? JSON.parse(saved) : [];
    results.unshift(fullResult);
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
  },

  /**
   * GET STUDENT EXAM STATS & READINESS INDEX
   */
  getStudentStats: async (studentId: string) => {
    let results: ExamResult[] = [];

    if (isConfigValid && db) {
      try {
        const q = query(collection(db, 'exam_results'), where('studentId', '==', studentId));
        const snap = await getDocs(q);
        results = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            studentId: d.studentId,
            studentName: d.studentName,
            quizId: d.quizId,
            quizTitle: d.quizTitle,
            subject: d.subject,
            score: d.score,
            totalQuestions: d.totalQuestions,
            percentage: d.percentage,
            timeSpentSeconds: d.timeSpentSeconds,
            date: d.date,
            timestamp: d.timestamp instanceof Timestamp ? d.timestamp.toDate().toISOString() : d.timestamp
          };
        });
      } catch {
        const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
        results = saved ? JSON.parse(saved) : [];
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
      results = saved ? JSON.parse(saved) : [];
    }

    if (results.length === 0) {
      return {
        readinessIndex: 0,
        totalExams: 0,
        avgPercentage: 0,
        history: []
      };
    }

    const totalExams = results.length;
    const totalPercentage = results.reduce((acc, curr) => acc + curr.percentage, 0);
    const avgPercentage = Math.round(totalPercentage / totalExams);
    // GTU Readiness formula based on exam consistency & average score
    const readinessIndex = Math.min(99, Math.round(avgPercentage * 0.9 + Math.min(10, totalExams * 2)));

    return {
      readinessIndex,
      totalExams,
      avgPercentage,
      history: results
    };
  },

  /**
   * PUBLISH OFFICIAL FACULTY QUIZ (Firebase + Local Storage)
   */
  publishQuiz: async (quiz: Omit<Quiz, 'id'> | Quiz): Promise<Quiz> => {
    const quizId = 'id' in quiz && quiz.id ? quiz.id : `quiz-${Date.now()}`;
    const fullQuiz: Quiz = {
      ...quiz,
      id: quizId,
      isOfficial: true,
      createdAt: quiz.createdAt || Date.now()
    };

    if (isConfigValid && db) {
      try {
        await addDoc(collection(db, 'official_quizzes'), {
          ...fullQuiz,
          timestamp: serverTimestamp()
        });
      } catch {
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    const quizzes: Quiz[] = saved ? JSON.parse(saved) : [];
    quizzes.unshift(fullQuiz);
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
    return fullQuiz;
  },

  /**
   * GET OFFICIAL QUIZZES (Faculty Published)
   */
  getOfficialQuizzes: async (): Promise<Quiz[]> => {
    let quizzes: Quiz[] = [];

    if (isConfigValid && db) {
      try {
        const snap = await getDocs(collection(db, 'official_quizzes'));
        quizzes = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            subject: data.subject,
            unit: data.unit,
            durationMinutes: data.durationMinutes,
            questions: data.questions || [],
            isOfficial: true,
            createdBy: data.createdBy,
            createdAt: data.createdAt
          };
        });
      } catch {
        const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
        quizzes = saved ? JSON.parse(saved) : [];
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
      quizzes = saved ? JSON.parse(saved) : [];
    }

    if (quizzes.length === 0) {
      return [];
    }
    return quizzes;
  },

  /**
   * DELETE OFFICIAL QUIZ
   */
  deleteOfficialQuiz: async (quizId: string): Promise<void> => {
    if (isConfigValid && db) {
      try {
        await deleteDoc(doc(db, 'official_quizzes', quizId));
      } catch {
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (saved) {
      const quizzes: Quiz[] = JSON.parse(saved);
      const filtered = quizzes.filter(q => q.id !== quizId);
      localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(filtered));
    }
  },

  /**
   * GET ALL EXAM RESULTS (FOR FACULTY GRADEBOOK)
   */
  getAllExamResults: async (): Promise<ExamResult[]> => {
    let results: ExamResult[] = [];

    if (isConfigValid && db) {
      try {
        const snap = await getDocs(collection(db, 'exam_results'));
        results = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            studentId: d.studentId,
            studentName: d.studentName || 'Student',
            quizId: d.quizId,
            quizTitle: d.quizTitle,
            subject: d.subject,
            score: d.score,
            totalQuestions: d.totalQuestions,
            percentage: d.percentage,
            timeSpentSeconds: d.timeSpentSeconds,
            date: d.date,
            timestamp: d.timestamp instanceof Timestamp ? d.timestamp.toDate().toISOString() : d.timestamp
          };
        });
      } catch {
        const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
        results = saved ? JSON.parse(saved) : [];
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
      results = saved ? JSON.parse(saved) : [];
    }

    if (results.length === 0) {
      return [];
    }
    return results;
  },

  /**
   * GET CLASS READINESS OVERVIEW METRICS
   */
  getClassReadinessOverview: (results: ExamResult[]) => {
    if (results.length === 0) {
      return {
        classReadinessIndex: 0,
        totalSubmissions: 0,
        avgPercentage: 0,
        passRate: 0,
        topSubject: 'N/A',
        readinessStatus: 'NO DATA AVAILABLE'
      };
    }

    const totalSubmissions = results.length;
    const sumPercentage = results.reduce((acc, r) => acc + r.percentage, 0);
    const avgPercentage = Math.round(sumPercentage / totalSubmissions);
    const passedCount = results.filter(r => r.percentage >= 60).length;
    const passRate = Math.round((passedCount / totalSubmissions) * 100);

    const subjectScores: Record<string, { total: number; count: number }> = {};
    results.forEach(r => {
      if (!subjectScores[r.subject]) {
        subjectScores[r.subject] = { total: 0, count: 0 };
      }
      const entry = subjectScores[r.subject]!;
      entry.total += r.percentage;
      entry.count += 1;
    });

    let topSubject = 'N/A';
    let topAvg = 0;
    Object.entries(subjectScores).forEach(([sub, data]) => {
      const avg = data.total / data.count;
      if (avg > topAvg) {
        topAvg = avg;
        topSubject = sub;
      }
    });

    const classReadinessIndex = Math.min(99, Math.round(avgPercentage * 0.85 + (passRate * 0.15)));
    const readinessStatus = classReadinessIndex >= 80 ? 'EXAM READY 🚀' : classReadinessIndex >= 65 ? 'MODERATE PREPARATION 📚' : 'NEEDS ATTENTION ⚠️';

    return {
      classReadinessIndex,
      totalSubmissions,
      avgPercentage,
      passRate,
      topSubject,
      readinessStatus
    };
  },

  /**
   * GET AI GTU PAST PAPER SOLUTION KEY
   * Uses Gemini 3 Pro thinking model to generate step-by-step paper solutions in Markdown.
   */
  getAIQuestionSolution: async (paperTitle: string, subject: string): Promise<string> => {
    const cacheKey = `${subject}::${paperTitle}`;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAPER_SOLUTIONS);
      if (saved) {
        const cache: Record<string, string> = JSON.parse(saved);
        if (cache[cacheKey]) {
          return cache[cacheKey];
        }
      }
    } catch {
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please configure your API key in Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert GTU (Gujarat Technological University) Senior Professor and Exam Examiner for ${subject}.
      Generate a comprehensive, step-by-step official GTU Solution Key for the paper: "${paperTitle}".

      Format your response in clear, well-structured Markdown. Include:
      - Detailed question breakdowns (e.g. Q1(a), Q1(b), Q2(a)...)
      - Core definitions, architectural/block diagrams (explained clearly), equations, and examples.
      - Mark allocations per sub-question (e.g. [3 Marks], [7 Marks]) with GTU scoring tips.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    const solutionMarkdown = response.text || "No solution generated.";

    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAPER_SOLUTIONS);
      const cache: Record<string, string> = saved ? JSON.parse(saved) : {};
      cache[cacheKey] = solutionMarkdown;
      localStorage.setItem(STORAGE_KEY_PAPER_SOLUTIONS, JSON.stringify(cache));
    } catch {
    }

    return solutionMarkdown;
  },

  /**
   * FALLBACK OFFLINE QUIZ — Subject-aware GTU content
   */
  getFallbackQuiz: (subject: string, unit: string): Quiz => {
    const s = subject.toLowerCase();
    const isEC = s.includes('electron') || s.includes('network') || s.includes('digital') || s.includes('signal') || s.includes('micro');
    const questions: QuizQuestion[] = isEC ? [
      { id:'q1', question:'Which component is used to store electric charge in a circuit?', options:['Resistor','Capacitor','Inductor','Transistor'], correctAnswer:1, explanation:'A capacitor stores electric charge and energy in an electric field between its plates.' },
      { id:'q2', question:'The unit of electrical resistance is:', options:['Ampere','Volt','Ohm','Watt'], correctAnswer:2, explanation:'Resistance is measured in Ohms (Ω), named after Georg Simon Ohm who stated Ohm\'s Law: V = IR.' },
      { id:'q3', question:'In a P-N junction diode, forward bias means:', options:['Positive to N, Negative to P','Positive to P, Negative to N','Both terminals at same potential','Reverse voltage applied'], correctAnswer:1, explanation:'Forward bias connects the positive terminal to the P-side and negative to the N-side, allowing current to flow.' },
      { id:'q4', question:'The truth table of AND gate: A=1, B=0 gives output:', options:['1','0','Undefined','Both 0 and 1'], correctAnswer:1, explanation:'AND gate output is 1 only when ALL inputs are 1. Since B=0, output is 0.' },
      { id:'q5', question:'Which flip-flop is known as a "divide-by-2" circuit?', options:['SR Flip-flop','D Flip-flop','JK Flip-flop','T Flip-flop'], correctAnswer:3, explanation:'T (Toggle) flip-flop changes state on every clock pulse, dividing the clock frequency by 2.' },
    ] : [
      { id:'q1', question:'Which protocol is used for secure web communication?', options:['HTTP','FTP','HTTPS','SMTP'], correctAnswer:2, explanation:'HTTPS (HTTP Secure) uses SSL/TLS encryption to secure data between browser and server.' },
      { id:'q2', question:'What does CPU stand for?', options:['Central Processing Unit','Central Program Unit','Computer Processing Unit','Core Processing Utility'], correctAnswer:0, explanation:'CPU — Central Processing Unit — is the brain of a computer, executing instructions.' },
      { id:'q3', question:'In HTML, which tag creates a hyperlink?', options:['<link>','<href>','<a>','<url>'], correctAnswer:2, explanation:'The <a> anchor tag with href attribute creates hyperlinks in HTML.' },
      { id:'q4', question:'Which CSS property controls text size?', options:['text-weight','font-size','text-style','font-weight'], correctAnswer:1, explanation:'font-size property sets the size of the text, e.g., font-size: 16px.' },
      { id:'q5', question:'A computer network that covers a small area (single building) is called:', options:['WAN','MAN','LAN','PAN'], correctAnswer:2, explanation:'LAN (Local Area Network) covers a limited area like a building or campus.' },
    ];
    return {
      id: `fallback-${Date.now()}`,
      title: `${subject} — GTU Practice Set`,
      subject, unit, durationMinutes: 10,
      questions,
      isOfficial: false,
      createdAt: Date.now()
    };
  },

  /**
   * SEED DEFAULT QUIZZES ON FIRST APP LAUNCH
   * Populates localStorage with real GTU EC & ICTET offline quiz banks.
   * Call once from App.tsx on mount.
   */
  seedDefaultQuizzes: () => {
    const SEED_KEY = 'gpa_hub_quizzes_seeded_v2';
    if (localStorage.getItem(SEED_KEY)) return;

    const defaultQuizzes: Quiz[] = [
      // ── EC BRANCH ─────────────────────────────────────────────────────
      {
        id: 'gtu-ec-basic-electronics-sem1',
        title: 'Basic Electronics — Sem 1 (GTU Official)',
        subject: 'Basic Electronics',
        unit: 'Unit 1-3',
        durationMinutes: 20,
        isOfficial: true,
        createdBy: 'GTU Exam Cell',
        createdAt: Date.now(),
        questions: [
          { id:'be1', question:'Ohm\'s Law states that current is proportional to:', options:['Resistance','Voltage','Power','Frequency'], correctAnswer:1, explanation:'Ohm\'s Law: I = V/R. Current (I) is directly proportional to Voltage (V) at constant resistance.' },
          { id:'be2', question:'Which material has the lowest resistivity?', options:['Silicon','Germanium','Copper','Carbon'], correctAnswer:2, explanation:'Copper has resistivity of ~1.7×10⁻⁸ Ω·m, making it the best conductor among these.' },
          { id:'be3', question:'A transistor in saturation region acts as:', options:['Open switch','Amplifier','Closed switch','Oscillator'], correctAnswer:2, explanation:'In saturation, both junctions are forward biased and transistor acts like a closed switch (ON state).' },
          { id:'be4', question:'The knee voltage of a silicon diode is approximately:', options:['0.2V','0.7V','1.2V','2.0V'], correctAnswer:1, explanation:'Silicon diode has a forward voltage drop (knee voltage) of approximately 0.7V.' },
          { id:'be5', question:'Zener diode is used primarily as:', options:['Rectifier','Amplifier','Voltage regulator','Oscillator'], correctAnswer:2, explanation:'Zener diode operates in reverse breakdown region to maintain a constant output voltage — used as a voltage regulator.' },
          { id:'be6', question:'BJT stands for:', options:['Bipolar Junction Transistor','Binary Junction Transistor','Bipolar JFET Terminal','Base Junction Terminal'], correctAnswer:0, explanation:'BJT = Bipolar Junction Transistor — has two P-N junctions and uses both holes and electrons as carriers.' },
          { id:'be7', question:'Which configuration gives highest voltage gain in BJT?', options:['Common Base','Common Emitter','Common Collector','None'], correctAnswer:1, explanation:'Common Emitter (CE) configuration provides highest voltage gain (~hundreds) among the three BJT configurations.' },
          { id:'be8', question:'The color code for a 470Ω resistor (4-band) is:', options:['Yellow-Violet-Brown-Gold','Red-Violet-Brown-Gold','Yellow-Violet-Black-Gold','Orange-Violet-Brown-Gold'], correctAnswer:0, explanation:'4=Yellow, 7=Violet, ×10=Brown, ±5%=Gold → 470Ω ±5%.' },
        ],
      },
      {
        id: 'gtu-ec-network-analysis-sem3',
        title: 'Network Analysis — Sem 3 (GTU)',
        subject: 'Network Analysis',
        unit: 'All Units',
        durationMinutes: 20,
        isOfficial: true,
        createdBy: 'GTU Exam Cell',
        createdAt: Date.now(),
        questions: [
          { id:'na1', question:'KCL states that sum of currents at a node is:', options:['Equal to voltage','Zero','Equal to resistance','Maximum'], correctAnswer:1, explanation:'Kirchhoff\'s Current Law (KCL): Sum of all currents entering a node = Sum of all currents leaving. Net = 0.' },
          { id:'na2', question:'In series RLC circuit at resonance, impedance is:', options:['Maximum','Minimum','Zero','Infinite'], correctAnswer:1, explanation:'At resonance, XL = XC, so they cancel. Impedance Z = R (minimum), current is maximum.' },
          { id:'na3', question:'Thevenin\'s theorem replaces a network with:', options:['Current source + parallel R','Voltage source + series R','Two resistors','Capacitor + inductor'], correctAnswer:1, explanation:'Thevenin equivalent = Vth (open circuit voltage) in series with Rth (Thevenin resistance).' },
          { id:'na4', question:'The time constant of an RC circuit is:', options:['R/C','RC','R+C','1/RC'], correctAnswer:1, explanation:'Time constant τ = RC (seconds). It represents time for capacitor to charge to 63.2% of supply voltage.' },
          { id:'na5', question:'Power factor of a purely resistive circuit is:', options:['0','0.5','1','Infinity'], correctAnswer:2, explanation:'Purely resistive circuit has voltage and current in phase, so cos(0°) = 1. Power factor = 1.' },
          { id:'na6', question:'Norton\'s theorem replaces a network with:', options:['Voltage source + series R','Current source + parallel R','Thevenin source','Dependent source'], correctAnswer:1, explanation:'Norton equivalent = IN (short circuit current) in parallel with RN (Norton resistance = Rth).' },
          { id:'na7', question:'Superposition theorem is applicable for:', options:['Non-linear circuits only','Linear circuits only','Any circuit','Circuits with no source'], correctAnswer:1, explanation:'Superposition applies only to linear circuits — response due to each source is added algebraically.' },
        ],
      },
      {
        id: 'gtu-ec-digital-sem2',
        title: 'Digital Electronics — Sem 2 (GTU)',
        subject: 'Digital Electronics',
        unit: 'Logic Gates & Combinational',
        durationMinutes: 20,
        isOfficial: true,
        createdBy: 'GTU Exam Cell',
        createdAt: Date.now(),
        questions: [
          { id:'de1', question:'Universal gates are:', options:['AND, OR','NOT, AND','NAND, NOR','XOR, XNOR'], correctAnswer:2, explanation:'NAND and NOR are universal gates — any Boolean function can be implemented using only NAND or only NOR gates.' },
          { id:'de2', question:'Binary number 1010 in decimal is:', options:['8','10','12','14'], correctAnswer:1, explanation:'1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8+0+2+0 = 10.' },
          { id:'de3', question:'2\'s complement of 0110 is:', options:['1001','1010','1110','0110'], correctAnswer:1, explanation:'1\'s complement of 0110 = 1001. 2\'s complement = 1001 + 1 = 1010.' },
          { id:'de4', question:'A full adder has how many inputs?', options:['2','3','4','1'], correctAnswer:1, explanation:'Full adder has 3 inputs: A, B, and Carry-in (Cin). Outputs: Sum and Carry-out.' },
          { id:'de5', question:'K-map is used for:', options:['Binary multiplication','Boolean function minimization','Decimal conversion','Memory design'], correctAnswer:1, explanation:'Karnaugh Map (K-map) provides systematic method for minimizing Boolean expressions to reduce gate count.' },
          { id:'de6', question:'Hexadecimal F is equivalent to decimal:', options:['14','15','16','13'], correctAnswer:1, explanation:'Hexadecimal digits: 0-9 same as decimal, A=10, B=11, C=12, D=13, E=14, F=15.' },
          { id:'de7', question:'JK flip-flop with J=1, K=1 input gives:', options:['Set','Reset','No change','Toggle'], correctAnswer:3, explanation:'JK flip-flop: J=0,K=0→No change; J=1,K=0→Set; J=0,K=1→Reset; J=1,K=1→Toggle (complement).' },
        ],
      },

      // ── ICTET BRANCH ──────────────────────────────────────────────────
      {
        id: 'gtu-ictet-networking-sem3',
        title: 'Computer Networks — Sem 3 (GTU ICTET)',
        subject: 'Computer Networks',
        unit: 'All Units',
        durationMinutes: 20,
        isOfficial: true,
        createdBy: 'GTU Exam Cell',
        createdAt: Date.now(),
        questions: [
          { id:'cn1', question:'OSI model has how many layers?', options:['4','5','7','3'], correctAnswer:2, explanation:'OSI (Open Systems Interconnection) model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.' },
          { id:'cn2', question:'IP address class A range is:', options:['128-191','192-223','1-126','224-247'], correctAnswer:2, explanation:'Class A: 1.0.0.0 to 126.0.0.0. First bit = 0. Supports 16M+ hosts per network.' },
          { id:'cn3', question:'TCP is a ________ protocol:', options:['Connectionless','Unreliable','Connection-oriented','Stateless'], correctAnswer:2, explanation:'TCP (Transmission Control Protocol) is connection-oriented — establishes a 3-way handshake before data transfer.' },
          { id:'cn4', question:'DNS converts:', options:['IP to MAC','Domain name to IP','IP to physical address','Email to IP'], correctAnswer:1, explanation:'DNS (Domain Name System) resolves human-readable domain names (google.com) to IP addresses (142.250.x.x).' },
          { id:'cn5', question:'Which device operates at Network layer (Layer 3)?', options:['Switch','Hub','Router','Repeater'], correctAnswer:2, explanation:'Router operates at Layer 3 (Network). It routes packets between different networks using IP addresses.' },
          { id:'cn6', question:'Default subnet mask for Class C is:', options:['255.0.0.0','255.255.0.0','255.255.255.0','255.255.255.255'], correctAnswer:2, explanation:'Class C default subnet mask = 255.255.255.0 (/24). Supports 254 usable hosts per network.' },
          { id:'cn7', question:'HTTP uses port number:', options:['21','23','80','443'], correctAnswer:2, explanation:'HTTP uses port 80. HTTPS uses port 443. FTP uses 21. Telnet uses 23.' },
        ],
      },
      {
        id: 'gtu-ictet-webtech-sem4',
        title: 'Web Technology — Sem 4 (GTU ICTET)',
        subject: 'Web Technology',
        unit: 'HTML/CSS/JS',
        durationMinutes: 20,
        isOfficial: true,
        createdBy: 'GTU Exam Cell',
        createdAt: Date.now(),
        questions: [
          { id:'wt1', question:'Which HTML tag defines the largest heading?', options:['<h6>','<heading>','<h1>','<head>'], correctAnswer:2, explanation:'<h1> defines the largest/most important heading. <h6> is the smallest. There are 6 heading levels.' },
          { id:'wt2', question:'CSS selector for class "box" is:', options:['#box','.box','box','*box'], correctAnswer:1, explanation:'.box selects all elements with class="box". # is for ID, no prefix for element, * is universal.' },
          { id:'wt3', question:'JavaScript is a ________ language:', options:['Compiled','Machine','Interpreted','Assembly'], correctAnswer:2, explanation:'JavaScript is an interpreted (scripting) language — executed line by line by browser\'s JS engine.' },
          { id:'wt4', question:'Which HTML5 element plays video?', options:['<media>','<video>','<movie>','<film>'], correctAnswer:1, explanation:'HTML5 <video> element: <video src="file.mp4" controls></video> — no Flash needed.' },
          { id:'wt5', question:'PHP stands for:', options:['Personal Home Page','Private Hypertext Preprocessor','PHP: Hypertext Preprocessor','Programmable HTML Page'], correctAnswer:2, explanation:'PHP originally stood for "Personal Home Page" but now officially means "PHP: Hypertext Preprocessor" (recursive).' },
          { id:'wt6', question:'CSS box model layers (outside to inside):', options:['Padding→Border→Margin→Content','Margin→Border→Padding→Content','Border→Margin→Padding→Content','Content→Padding→Margin→Border'], correctAnswer:1, explanation:'CSS Box Model (outer to inner): Margin → Border → Padding → Content.' },
          { id:'wt7', question:'SQL SELECT statement syntax:', options:['SELECT * TABLE students','SELECT * FROM students','GET * FROM students','FETCH * students'], correctAnswer:1, explanation:'Basic SQL: SELECT columns FROM tablename WHERE condition; Example: SELECT * FROM students;' },
        ],
      },
      {
        id: 'gtu-ictet-cprog-sem1',
        title: 'C Programming — Sem 1 (GTU)',
        subject: 'C Programming',
        unit: 'All Units',
        durationMinutes: 20,
        isOfficial: true,
        createdBy: 'GTU Exam Cell',
        createdAt: Date.now(),
        questions: [
          { id:'cp1', question:'Which header file is required for printf()?', options:['<math.h>','<stdlib.h>','<stdio.h>','<string.h>'], correctAnswer:2, explanation:'<stdio.h> (Standard Input Output) provides printf(), scanf(), and file I/O functions.' },
          { id:'cp2', question:'Size of int data type in C (32-bit system):', options:['1 byte','2 bytes','4 bytes','8 bytes'], correctAnswer:2, explanation:'int is 4 bytes (32 bits) on most modern 32-bit and 64-bit systems. Range: -2³¹ to 2³¹-1.' },
          { id:'cp3', question:'Which loop is guaranteed to execute at least once?', options:['for','while','do-while','All of above'], correctAnswer:2, explanation:'do-while loop checks condition AFTER executing body — guaranteed to run at least once even if condition is false.' },
          { id:'cp4', question:'Correct way to declare array of 5 integers:', options:['int a{5}','array int a[5]','int a[5]','int[5] a'], correctAnswer:2, explanation:'int a[5]; declares array of 5 integers: a[0] to a[4]. Index starts from 0 in C.' },
          { id:'cp5', question:'& operator in C is used for:', options:['Multiplication','Bitwise AND / Address-of','Logical OR','Division'], correctAnswer:1, explanation:'& is used for: (1) Bitwise AND between two integers, (2) Address-of operator to get memory address of a variable.' },
          { id:'cp6', question:'What does return 0; at end of main() mean?', options:['Error occurred','Program ran successfully','Restart program','Nothing'], correctAnswer:1, explanation:'return 0 from main() signals the OS that the program terminated successfully (exit code 0 = success).' },
          { id:'cp7', question:'strcpy() function is used to:', options:['Compare strings','Copy one string to another','Find string length','Concatenate strings'], correctAnswer:1, explanation:'strcpy(dest, src) copies string from src to dest. strcat() concatenates, strlen() gives length, strcmp() compares.' },
        ],
      },
    ];

    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(defaultQuizzes));
    localStorage.setItem(SEED_KEY, '1');
  }
};

