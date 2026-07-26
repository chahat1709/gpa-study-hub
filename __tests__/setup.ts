import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock firebase module before anything else
vi.mock('../firebase', () => ({
  app: null,
  auth: null,
  db: null,
  storage: null,
  isConfigValid: false,
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [], empty: true }),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
  onSnapshot: vi.fn().mockReturnValue(vi.fn()),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  doc: vi.fn(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  serverTimestamp: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  Timestamp: { fromDate: vi.fn() },
}));

// Mock firebase/storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn().mockResolvedValue({ ref: {} }),
  getDownloadURL: vi.fn().mockResolvedValue('https://mock-storage.url/file'),
}));

// Mock firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn().mockReturnValue([]),
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', { writable: true, value: true });

// Mock navigator.deviceMemory and navigator.hardwareConcurrency
Object.defineProperty(navigator, 'deviceMemory', { writable: true, value: 4 });
Object.defineProperty(navigator, 'hardwareConcurrency', { writable: true, value: 4 });

// Mock window.addEventListener for offline service
const originalAddEventListener = window.addEventListener.bind(window);
window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
  if (type === 'online' || type === 'offline') return;
  return originalAddEventListener(type, listener, options);
}) as typeof window.addEventListener;

// Mock URL.createObjectURL for resource uploads
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock-url';
}

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
