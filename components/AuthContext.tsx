import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import {
  getSession, clearSession,
  loginStudent, registerStudent,
  loginFacultyLocal, registerFacultyLocal,
  loginAdmin,
  changePin as changePinService,
  hasPermission, requireRole,
} from '../services/rbacAuthService';
import type { Permission } from '../services/rbacAuthService';
import { compressImage, validateImageFile, getBase64Size } from '../utils/imageCompression';
import { checkServerHealth, signup as apiSignup, login as apiLogin, facultySignup as apiFacultySignup, facultyLogin as apiFacultyLogin, adminLogin as apiAdminLogin, changePin as apiChangePin, updateProfile as apiUpdateProfile } from '../services/apiClient';

const SESSION_KEY = 'gpa_rbac_session_v1';
const SERVER_CONNECTED_KEY = 'gpa_hub_server_connected';

function isServerConnected(): boolean {
  return localStorage.getItem(SERVER_CONNECTED_KEY) === 'true';
}

function apiUserToUser(apiUser: any): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    role: (apiUser.role || 'STUDENT') as UserRole,
    enrollmentNumber: apiUser.enrollment_number,
    email: apiUser.email,
    branch: apiUser.branch || '',
    semester: apiUser.semester || '',
    section: apiUser.section || '',
    university: apiUser.university || 'GTU',
    photoURL: apiUser.photo_url,
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;

  // Student
  studentRegister: (name: string, enrollmentNumber: string, pin: string, branch: string, semester: string, section: string, university?: string) => Promise<void>;
  studentLogin: (enrollmentNumber: string, pin: string) => Promise<void>;
  changePin: (enrollmentNumber: string, oldPin: string, newPin: string) => Promise<void>;

  // Faculty
  facultyRegister: (name: string, email: string, password: string, branch: string, university?: string) => Promise<void>;
  facultyLogin: (email: string, password: string) => Promise<void>;

  // Admin
  adminLogin: (code: string) => Promise<void>;

  // Profile
  uploadProfilePicture: (file: File) => Promise<void>;

  // Auth
  logout: () => void;

  // RBAC helpers exposed to UI
  can: (permission: Permission) => boolean;
  isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const session = getSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  const saveSession = (u: User) => {
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  };

  // ── Student ──────────────────────────────────────────────────────────────────
  const studentRegister = async (
    name: string, enrollmentNumber: string, pin: string,
    branch: string, semester: string, section: string, university?: string
  ) => {
    if (isServerConnected()) {
      const res = await apiSignup({ name, enrollmentNumber, pin, branch, semester, section, university: university || 'GTU' });
      const u = apiUserToUser(res.user);
      saveSession(u);
    } else {
      const u = await registerStudent({ name, enrollmentNumber, pin, branch, semester, section, university });
      setUser(u);
    }
  };

  const studentLogin = async (enrollmentNumber: string, pin: string) => {
    if (isServerConnected()) {
      const res = await apiLogin(enrollmentNumber, pin);
      const u = apiUserToUser(res.user);
      saveSession(u);
    } else {
      const u = await loginStudent(enrollmentNumber, pin);
      setUser(u);
    }
  };

  const changePin = async (enrollmentNumber: string, oldPin: string, newPin: string) => {
    if (isServerConnected() && user) {
      await apiChangePin(user.id, oldPin, newPin);
    } else {
      await changePinService(enrollmentNumber, oldPin, newPin);
    }
  };

  // ── Faculty ──────────────────────────────────────────────────────────────────
  const facultyRegister = async (name: string, email: string, password: string, branch: string, university?: string) => {
    if (isServerConnected()) {
      const res = await apiFacultySignup({ name, email, password, branch });
      const u = apiUserToUser(res.user);
      saveSession(u);
    } else {
      const u = await registerFacultyLocal({ name, email, password, branch, university });
      setUser(u);
    }
  };

  const facultyLogin = async (email: string, password: string) => {
    if (isServerConnected()) {
      const res = await apiFacultyLogin(email, password);
      const u = apiUserToUser(res.user);
      saveSession(u);
    } else {
      const u = await loginFacultyLocal(email, password);
      setUser(u);
    }
  };

  // ── Admin ────────────────────────────────────────────────────────────────────
  const adminLogin = async (code: string) => {
    if (isServerConnected()) {
      const res = await apiAdminLogin(code);
      const u = apiUserToUser(res.user);
      saveSession(u);
    } else {
      const u = await loginAdmin(code);
      setUser(u);
    }
  };

  // ── Profile ──────────────────────────────────────────────────────────────────
  const uploadProfilePicture = async (file: File) => {
    if (!user) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const compressedBase64 = await compressImage(file, {
      maxWidth: 256,
      maxHeight: 256,
      quality: 0.75,
      outputFormat: 'image/jpeg'
    });

    if (isServerConnected()) {
      const res = await apiUpdateProfile(user.id, compressedBase64);
      const u = apiUserToUser(res.user);
      u.photoURL = compressedBase64;
      saveSession(u);
    } else {
      const updated = { ...user, photoURL: compressedBase64 };
      setUser(updated);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));

      try {
        const db: Record<string, any> = JSON.parse(localStorage.getItem('gpa_rbac_users_v1') || '{}');
        if (db[user.id]) {
          db[user.id].photoURL = compressedBase64;
          localStorage.setItem('gpa_rbac_users_v1', JSON.stringify(db));
        }
      } catch { /* ignore */ }
    }
  };


  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = () => {
    clearSession();
    setUser(null);
  };

  // ── RBAC helpers ─────────────────────────────────────────────────────────────
  const can = (permission: Permission) => hasPermission(user, permission);
  const isRole = (...roles: UserRole[]) => requireRole(user, roles);

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      studentRegister, studentLogin, changePin,
      facultyRegister, facultyLogin,
      adminLogin,
      uploadProfilePicture,
      logout,
      can, isRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
