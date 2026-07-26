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
import { compressImage, validateImageFile } from '../utils/imageCompression';
import { signup as apiSignup, login as apiLogin, facultySignup as apiFacultySignup, facultyLogin as apiFacultyLogin, adminLogin as apiAdminLogin, changePin as apiChangePin, updateProfile as apiUpdateProfile, checkServerHealth, clearAuthToken } from '../services/apiClient';

const SESSION_KEY = 'gpa_rbac_session_v1';

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
  serverOnline: boolean;

  studentRegister: (name: string, enrollmentNumber: string, pin: string, branch: string, semester: string, section: string, university?: string) => Promise<void>;
  studentLogin: (enrollmentNumber: string, pin: string) => Promise<void>;
  changePin: (enrollmentNumber: string, oldPin: string, newPin: string) => Promise<void>;

  facultyRegister: (name: string, email: string, password: string, branch: string, university?: string) => Promise<void>;
  facultyLogin: (email: string, password: string) => Promise<void>;

  adminLogin: (code: string) => Promise<void>;

  uploadProfilePicture: (file: File) => Promise<void>;

  logout: () => void;

  can: (permission: Permission) => boolean;
  isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    checkServerHealth().then(ok => setServerOnline(ok));
    setIsLoading(false);
  }, []);

  const saveSession = (u: User) => {
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  };

  // ─── Student Auth (Server-first with Offline Fallback) ──────────────────────
  const studentRegister = async (
    name: string, enrollmentNumber: string, pin: string,
    branch: string, semester: string, section: string, university?: string
  ) => {
    try {
      const res = await apiSignup({ name, enrollmentNumber, pin, branch, semester, section, university: university || 'GTU' });
      const u = apiUserToUser(res.user);
      saveSession(u);
    } catch {
      // Fallback to offline RBAC
      const u = await registerStudent({ name, enrollmentNumber, pin, branch, semester, section, university: university || 'GTU' });
      saveSession(u);
    }
  };

  const studentLogin = async (enrollmentNumber: string, pin: string) => {
    try {
      const res = await apiLogin(enrollmentNumber, pin);
      const u = apiUserToUser(res.user);
      saveSession(u);
    } catch {
      // Fallback to offline RBAC
      const u = await loginStudent(enrollmentNumber, pin);
      saveSession(u);
    }
  };

  const changePin = async (enrollmentNumber: string, oldPin: string, newPin: string) => {
    if (user) {
      try {
        await apiChangePin(user.id, oldPin, newPin);
      } catch {
        await changePinService(enrollmentNumber, oldPin, newPin);
      }
    }
  };

  // ─── Faculty Auth (Server-first with Offline Fallback) ─────────────────────
  const facultyRegister = async (name: string, email: string, password: string, branch: string, university?: string) => {
    try {
      const res = await apiFacultySignup({ name, email, password, branch });
      const u = apiUserToUser(res.user);
      saveSession(u);
    } catch {
      const u = await registerFacultyLocal({ name, email, password, branch, university: university || 'GTU' });
      saveSession(u);
    }
  };

  const facultyLogin = async (email: string, password: string) => {
    try {
      const res = await apiFacultyLogin(email, password);
      const u = apiUserToUser(res.user);
      saveSession(u);
    } catch {
      const u = await loginFacultyLocal(email, password);
      saveSession(u);
    }
  };

  // ─── Admin Auth ─────────────────────────────────────────────────────────────
  const adminLogin = async (code: string) => {
    try {
      const res = await apiAdminLogin(code);
      const u = apiUserToUser(res.user);
      saveSession(u);
    } catch {
      const u = await loginAdmin(code);
      saveSession(u);
    }
  };

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

    try {
      const res = await apiUpdateProfile(user.id, compressedBase64);
      const u = apiUserToUser(res.user);
      u.photoURL = compressedBase64;
      saveSession(u);
    } catch {
      // Offline: just update session
      const u = { ...user, photoURL: compressedBase64 };
      saveSession(u);
    }
  };

  const logout = () => {
    clearSession();
    clearAuthToken();
    setUser(null);
  };

  const can = (permission: Permission) => hasPermission(user, permission);
  const isRole = (...roles: UserRole[]) => requireRole(user, roles);

  return (
    <AuthContext.Provider value={{
      user, isLoading, serverOnline,
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
