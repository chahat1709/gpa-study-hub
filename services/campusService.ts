
import { Notice, DirectoryContact, LibraryResource } from '../types';
import { db, isConfigValid } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { resourceService } from './resourceService';

/**
 * CAMPUS DATA SERVICE - HYBRID MODE
 * Uses Firestore for Notices if configured, falls back to LocalStorage.
 */

const NOTICES_KEY = 'GPA_HUB_CAMPUS_NOTICES';

// --- Mock Implementation ---
const loadMockNotices = (): Notice[] => {
  const saved = localStorage.getItem(NOTICES_KEY);
  return saved ? JSON.parse(saved) : [
    {
      id: 'n1',
      title: 'Welcome to GPA Hub',
      content: 'Local Mode Active. Connect Firebase to see real notices.',
      date: Date.now(),
      priority: 'medium',
      author: 'System Admin',
      category: 'General',
      scope: 'COLLEGE'
    }
  ];
};

let mockNotices: Notice[] = loadMockNotices();

const saveMockNotices = (notices: Notice[]) => {
  localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
  mockNotices = notices;
};

// --- Directory Data (Static) ---
const MOCK_DIRECTORY: (DirectoryContact & { branch?: string; semester?: string })[] = [
  {
    id: 'f1',
    name: 'Dr. Sarah Wilson',
    designation: 'Head of Department',
    department: 'Computer Science',
    email: 'hod.cse@university.edu',
    phone: '+91 98765 43210',
    branch: 'CSE',
    semester: 'All'
  },
  {
    id: 'f2',
    name: 'Prof. Arjun Mehta',
    designation: 'Senior Lecturer',
    department: 'Computer Science',
    email: 'arjun.m@university.edu',
    phone: '+91 99887 76655',
    branch: 'CSE',
    semester: '4'
  }
];

// --- Hybrid Service ---
let realTimeNotices: Notice[] = [];

if (isConfigValid && db) {
  const q = query(collection(db, 'notices'), orderBy('date', 'desc'));
  const unsubscribeNotices = onSnapshot(q, (snapshot) => {
    realTimeNotices = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notice));
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      unsubscribeNotices();
    });
  }
}

export const campusService = {
  getNotices: (): Notice[] => {
    if (isConfigValid) return realTimeNotices;
    return mockNotices;
  },

  getDirectory: async (): Promise<DirectoryContact[]> => {
    if (isConfigValid && db) {
      const q = query(collection(db, 'campus_directory'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as DirectoryContact));
      }
    }
    return MOCK_DIRECTORY;
  },

  getFacultyForNode: async (branch?: string, semester?: string): Promise<DirectoryContact[]> => {
    let directory = MOCK_DIRECTORY;
    if (isConfigValid && db) {
      const q = query(collection(db, 'campus_directory'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        directory = snap.docs.map(d => ({ id: d.id, ...d.data() } as DirectoryContact & { branch?: string; semester?: string }));
      }
    }

    return directory.filter(contact => {
      if (contact.isEmergency) return true;
      if (!branch) return true;

      const faculty = contact as DirectoryContact & { branch?: string; semester?: string };
      const branchMatch = faculty.branch === branch || faculty.branch === 'All';
      const semMatch = faculty.semester === semester || faculty.semester === 'All' || !faculty.semester;

      return branchMatch && semMatch;
    });
  },

  seedCampusDirectory: async () => {
    if (isConfigValid && db) {
      const q = query(collection(db, 'campus_directory'));
      const snap = await getDocs(q);
      if (snap.empty) {
        for (const contact of MOCK_DIRECTORY) {
          await addDoc(collection(db, 'campus_directory'), contact);
        }
      }
    }
  },

  postNotice: async (notice: Omit<Notice, 'id' | 'date'>) => {
    const newNotice = {
      ...notice,
      date: Date.now()
    };

    if (isConfigValid && db) {
      await addDoc(collection(db, 'notices'), newNotice);
      return newNotice;
    } else {
      const notices = campusService.getNotices();
      const mockNotice = { ...newNotice, id: 'n-' + Math.random().toString(36).substring(7) };
      const updated = [mockNotice, ...notices];
      saveMockNotices(updated);
      return mockNotice;
    }
  },

  getRecentActivity: (branch: string, semester: string): LibraryResource[] => {
    const allResources = resourceService.getAllResources();
    return allResources
      .filter(r => r.branch === branch && r.semester === semester)
      .slice(-3)
      .reverse();
  }
};
