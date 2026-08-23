import { LibraryResource } from '../types';
import { db, storage, isConfigValid } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * HYBRID RESOURCE SERVICE
 * Handles file uploads to Firebase Storage & Firestore.
 * Falls back to LocalStorage if keys are missing.
 */

const STORAGE_KEY = 'GPA_HUB_GLOBAL_RESOURCES';

// --- Mock Helpers ---
const loadMockResources = (): Record<string, LibraryResource[]> => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : {};
};

const saveMockResources = (data: Record<string, LibraryResource[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Live Data Cache ---
let liveResources: LibraryResource[] = [];

if (isConfigValid && db) {
  const q = query(collection(db, 'resources'), limit(100));
  onSnapshot(q, snapshot => {
    liveResources = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as LibraryResource);
  });
}

export const resourceService = {
  getResources: (
    branch: string,
    semester: string,
    section: string,
    subject: string,
    category: string
  ): LibraryResource[] => {
    if (isConfigValid) {
      let filtered = liveResources.filter(
        r =>
          r.branch === branch &&
          r.semester === semester &&
          (r.section === section || r.section === 'All')
      );

      if (subject !== 'All') filtered = filtered.filter(r => r.subject === subject);
      if (category !== 'All') filtered = filtered.filter(r => r.category === category);

      return filtered;
    } else {
      const allResources = Object.values(loadMockResources()).flat() as LibraryResource[];
      return allResources.filter(
        r =>
          r.branch === branch &&
          r.semester === semester &&
          (r.section === section || r.section === 'All') &&
          (subject === 'All' || r.subject === subject) &&
          (category === 'All' || r.category === category)
      );
    }
  },

  getAllResources: (): LibraryResource[] => {
    if (isConfigValid) return liveResources;
    return Object.values(loadMockResources()).flat() as LibraryResource[];
  },

  uploadResource: async (
    branch: string,
    semester: string,
    section: string,
    subject: string,
    category: string,
    file: File,
    additionalMeta: { unit?: string; academicYear?: string; deadline?: string } = {}
  ) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Security Violation: File type ${file.type} is not allowed. Only PDF, DOCX, and Images.`
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Quota Exceeded: File size must be less than 10MB.');
    }

    const resourceData = {
      title: file.name,
      type: file.type.includes('pdf') ? 'pdf' : file.type.includes('video') ? 'video' : 'link',
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadDate: new Date().toLocaleDateString(),
      collegeCode: 'GTU-028',
      branch,
      semester,
      section,
      subject,
      category,
      unit: additionalMeta.unit || '',
      academicYear: additionalMeta.academicYear || '',
      deadline: additionalMeta.deadline || '',
      searchKeywords: [file.name.toLowerCase(), subject.toLowerCase(), category.toLowerCase()],
    };

    if (isConfigValid && db && storage) {
      const fileRef = ref(
        storage,
        `resources/${branch}/${semester}/${subject}/${Date.now()}_${file.name}`
      );
      const uploadResult = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, 'resources'), {
        ...resourceData,
        url,
      });
      return {
        ...resourceData,
        url,
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      const allData = loadMockResources();
      const key = `${branch}-${semester}-${section}-${subject}-${category}`;
      if (!allData[key]) allData[key] = [];

      const newResource: LibraryResource = {
        id: Math.random().toString(36).substring(7),
        ...resourceData,
        type: resourceData.type as LibraryResource['type'],
        url: URL.createObjectURL(file),
      };

      allData[key]!.push(newResource);
      saveMockResources(allData);
      return newResource;
    }
  },

  deleteResource: async (id: string) => {
    if (isConfigValid && db) {
      await deleteDoc(doc(db, 'resources', id));
    } else {
      const allData = loadMockResources();
      for (const key in allData) {
        const existing = allData[key];
        if (existing) {
          allData[key] = existing.filter((r: LibraryResource) => r.id !== id);
        }
      }
      saveMockResources(allData);
    }
  },

  searchGlobalResources: async (searchTerm: string): Promise<LibraryResource[]> => {
    if (!db || !isConfigValid) {
      const all = Object.values(loadMockResources()).flat() as LibraryResource[];
      return all.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    try {
      const q = query(
        collection(db, 'resources'),
        where('searchKeywords', 'array-contains', searchTerm.toLowerCase()),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }) as LibraryResource);
    } catch {
      return [];
    }
  },
};
