/**
 * GTU ACADEMIC MATRIX SERVICE
 * Handles university-wide subjects, sections, and semesters.
 * Sources: live API (/api/academic/*) with hardcoded matrix as offline fallback.
 */

import {
  getAcademicMeta,
  getAcademicSubjects,
  getAcademicSubjectDetail,
  getAcademicUnit,
  getAcademicQuestions,
  getAcademicPyqs,
  getAcademicNotes,
  getAcademicLabs,
  getAcademicProjects,
  getAcademicDashboard,
  AcademicSubject,
  AcademicUnit,
  SyllabusTopic,
  AcademicQuestion,
  Pyq,
  AcademicNote,
  LabExperiment,
  AcademicProject,
} from './apiClient';

const STORAGE_KEY = 'GPA_HUB_ACADEMIC_MATRIX';

interface AcademicMatrix {
  subjects: string[];
  sections: string[];
  semesters: string[];
  branches: string[];
  categories: string[];
}

const DEFAULT_MATRIX: AcademicMatrix = {
  subjects: [
    'Diploma EC - Basic Electronics (4311101)',
    'Diploma EC - Digital Electronics (4331102)',
    'Diploma EC - Analog Electronics (4341103)',
    'Diploma EC - Microcontroller & Embedded (4351104)',
    'Diploma EC - Optical Communication (4361105)',
    'ICTET - Fundamentals of ICT (4313201)',
    'ICTET - Computer Networks (4333202)',
    'ICTET - Web Development (4343203)',
    'ICTET - Cloud & IoT (4353204)',
    'ICTET - Cyber Security & Ethics (4363205)',
    'Engineering Maths (4300001)',
    'Communication Skills (4300002)',
  ],
  sections: ['All', 'A', 'B', 'C', 'D'],
  semesters: ['1', '2', '3', '4', '5', '6'],
  branches: ['Diploma EC', 'ICTET'],
  categories: [
    'Syllabus',
    'Lecture Notes',
    'Assignments',
    'Question Papers',
    'Lab Manuals',
    'Project Specs',
  ],
};

const loadMatrix = (): AcademicMatrix => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return DEFAULT_MATRIX;
};

let academicMatrix: AcademicMatrix = loadMatrix();

const saveMatrix = (matrix: AcademicMatrix) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
  academicMatrix = matrix;
};

const branchLabel = (branch: string): string =>
  branch === 'EC' ? 'Diploma EC' : branch === 'ICT' ? 'ICTET' : branch;

const subjectLabel = (s: { code: string; name: string; branch: string }): string =>
  `${branchLabel(s.branch)} - ${s.name} (${s.code})`;

export const academicService = {
  getSubjects: (): string[] => academicMatrix.subjects,
  getSections: (): string[] => academicMatrix.sections,
  getSemesters: (): string[] => academicMatrix.semesters,
  getCategories: (): string[] => academicMatrix.categories,

  addSubject: (name: string) => {
    if (!academicMatrix.subjects.includes(name)) {
      academicMatrix.subjects.push(name);
      saveMatrix(academicMatrix);
    }
  },

  removeSubject: (name: string) => {
    academicMatrix.subjects = academicMatrix.subjects.filter((s: string) => s !== name);
    saveMatrix(academicMatrix);
  },

  addCategory: (name: string) => {
    if (!academicMatrix.categories.includes(name)) {
      academicMatrix.categories.push(name);
      saveMatrix(academicMatrix);
    }
  },

  // ── Live content (falls back to the matrix above when the server is offline) ──

  getMeta: async (): Promise<{ branches: string[]; semesters: string[] }> => {
    try {
      const meta = await getAcademicMeta();
      return {
        branches: meta.branches.map(branchLabel),
        semesters: meta.semesters,
      };
    } catch {
      return { branches: academicMatrix.branches, semesters: academicMatrix.semesters };
    }
  },

  getSubjectList: async (branch?: string, semester?: string): Promise<AcademicSubject[]> => {
    try {
      const data = await getAcademicSubjects(branch, semester);
      return data.subjects;
    } catch {
      return [];
    }
  },

  getSubjectDetail: async (
    id: string
  ): Promise<{ subject: AcademicSubject; units: AcademicUnit[] } | null> => {
    try {
      return await getAcademicSubjectDetail(id);
    } catch {
      return null;
    }
  },

  getUnit: async (id: string): Promise<{ unit: AcademicUnit; topics: SyllabusTopic[] } | null> => {
    try {
      return await getAcademicUnit(id);
    } catch {
      return null;
    }
  },

  getQuestions: async (
    opts: {
      subjectId?: string;
      unitId?: string;
      type?: string;
      difficulty?: string;
      limit?: number;
    } = {}
  ): Promise<AcademicQuestion[]> => {
    try {
      const data = await getAcademicQuestions(opts);
      return data.questions;
    } catch {
      return [];
    }
  },

  getPyqs: async (
    opts: { subjectId?: string; year?: number; examType?: string } = {}
  ): Promise<Pyq[]> => {
    try {
      const data = await getAcademicPyqs(opts);
      return data.pyqs;
    } catch {
      return [];
    }
  },

  getNotes: async (
    opts: { subjectId?: string; unitId?: string; contentType?: string } = {}
  ): Promise<AcademicNote[]> => {
    try {
      const data = await getAcademicNotes(opts);
      return data.notes;
    } catch {
      return [];
    }
  },

  getLabs: async (subjectId?: string): Promise<LabExperiment[]> => {
    try {
      const data = await getAcademicLabs(subjectId);
      return data.labs;
    } catch {
      return [];
    }
  },

  getProjects: async (branch?: string, semester?: string): Promise<AcademicProject[]> => {
    try {
      const data = await getAcademicProjects(branch, semester);
      return data.projects;
    } catch {
      return [];
    }
  },

  getDashboard: async (
    branch?: string,
    semester?: string
  ): Promise<{
    subjects: number;
    units: number;
    questions: number;
    pyqs: number;
    notes: number;
    labs: number;
    projects: number;
  } | null> => {
    try {
      return await getAcademicDashboard(branch, semester);
    } catch {
      return null;
    }
  },
};
