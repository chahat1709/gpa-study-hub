import { describe, it, expect, beforeEach } from 'vitest';
import { academicService } from '../services/academicService';

describe('academicService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getSubjects', () => {
    it('should return default subjects', () => {
      const subjects = academicService.getSubjects();
      expect(Array.isArray(subjects)).toBe(true);
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects).toContain('Engineering Maths (4300001)');
    });
  });

  describe('getSections', () => {
    it('should return default sections', () => {
      const sections = academicService.getSections();
      expect(sections).toEqual(['All', 'A', 'B', 'C', 'D']);
    });
  });

  describe('getSemesters', () => {
    it('should return semesters 1-6', () => {
      const semesters = academicService.getSemesters();
      expect(semesters).toEqual(['1', '2', '3', '4', '5', '6']);
    });
  });

  describe('getCategories', () => {
    it('should return default categories', () => {
      const categories = academicService.getCategories();
      expect(categories).toContain('Syllabus');
      expect(categories).toContain('Lecture Notes');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('addSubject', () => {
    it('should add a new subject', () => {
      const before = academicService.getSubjects();
      const count = before.length;

      academicService.addSubject('New Subject (1234567)');
      const after = academicService.getSubjects();

      expect(after).toHaveLength(count + 1);
      expect(after).toContain('New Subject (1234567)');
    });

    it('should not add duplicate subjects', () => {
      const before = academicService.getSubjects();
      const count = before.length;

      academicService.addSubject(before[0]!);
      const after = academicService.getSubjects();

      expect(after).toHaveLength(count);
    });
  });

  describe('removeSubject', () => {
    it('should remove a subject', () => {
      academicService.addSubject('Temporary Subject (9999999)');
      const before = academicService.getSubjects();
      expect(before).toContain('Temporary Subject (9999999)');

      academicService.removeSubject('Temporary Subject (9999999)');
      const after = academicService.getSubjects();
      expect(after).not.toContain('Temporary Subject (9999999)');
    });
  });

  describe('addCategory', () => {
    it('should add a new category', () => {
      const before = academicService.getCategories();
      const count = before.length;

      academicService.addCategory('New Category');
      const after = academicService.getCategories();

      expect(after).toHaveLength(count + 1);
      expect(after).toContain('New Category');
    });

    it('should not add duplicate categories', () => {
      const before = academicService.getCategories();
      const count = before.length;

      academicService.addCategory(before[0]!);
      const after = academicService.getCategories();

      expect(after).toHaveLength(count);
    });
  });

  describe('persistence', () => {
    it('should persist changes to localStorage', () => {
      academicService.addCategory('Persistent Category');
      const saved = localStorage.getItem('GPA_HUB_ACADEMIC_MATRIX');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.categories).toContain('Persistent Category');
    });
  });
});
