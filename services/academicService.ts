
/**
 * GTU ACADEMIC MATRIX SERVICE
 * Handles university-wide subjects, sections, and semesters.
 */

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
    'Communication Skills (4300002)'
  ],
  sections: ['All', 'A', 'B', 'C', 'D'],
  semesters: ['1', '2', '3', '4', '5', '6'],
  branches: ['Diploma EC', 'ICTET'],
  categories: ['Syllabus', 'Lecture Notes', 'Assignments', 'Question Papers', 'Lab Manuals', 'Project Specs']
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
  }
};
