import { describe, it, expect, beforeEach } from 'vitest';
import { resourceService } from '../services/resourceService';

describe('resourceService (local mode)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAllResources', () => {
    it('should return empty array when no resources', () => {
      const resources = resourceService.getAllResources();
      expect(resources).toEqual([]);
    });
  });

  describe('getResources', () => {
    it('should filter by branch and semester', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file);

      const results = resourceService.getResources('CSE', '4', 'A', 'All', 'All');
      expect(results.length).toBe(1);
      expect(results[0]!.branch).toBe('CSE');
      expect(results[0]!.semester).toBe('4');
    });

    it('should return empty for non-matching filters', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file);

      const results = resourceService.getResources('IT', '4', 'A', 'All', 'All');
      expect(results).toEqual([]);
    });

    it('should filter by subject when not All', async () => {
      const file1 = new File(['test1'], 'dbms.pdf', { type: 'application/pdf' });
      const file2 = new File(['test2'], 'cyber.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file1);
      await resourceService.uploadResource('CSE', '4', 'A', 'CYBER SEC', 'Lecture Notes', file2);

      const results = resourceService.getResources('CSE', '4', 'A', 'DBMS', 'All');
      expect(results.length).toBe(1);
      expect(results[0]!.subject).toBe('DBMS');
    });

    it('should filter by category when not All', async () => {
      const file1 = new File(['test1'], 'notes.pdf', { type: 'application/pdf' });
      const file2 = new File(['test2'], 'paper.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file1);
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Question Papers', file2);

      const results = resourceService.getResources('CSE', '4', 'A', 'All', 'Question Papers');
      expect(results.length).toBe(1);
      expect(results[0]!.category).toBe('Question Papers');
    });

    it('should match Section "All" for any section', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'All', 'DBMS', 'Lecture Notes', file);

      const results = resourceService.getResources('CSE', '4', 'A', 'All', 'All');
      expect(results.length).toBe(1);
    });
  });

  describe('uploadResource', () => {
    it('should upload a valid PDF file', async () => {
      const file = new File(['test content'], 'notes.pdf', { type: 'application/pdf' });
      const result = await resourceService.uploadResource(
        'CSE', '4', 'A', 'DBMS', 'Lecture Notes', file
      );

      expect(result.id).toBeDefined();
      expect(result.title).toBe('notes.pdf');
      expect(result.branch).toBe('CSE');
      expect(result.url).toBeDefined();
    });

    it('should reject non-allowed file types', async () => {
      const file = new File(['test'], 'virus.exe', { type: 'application/x-msdownload' });
      await expect(
        resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file)
      ).rejects.toThrow('Security Violation');
    });

    it('should reject files larger than 10MB', async () => {
      const largeContent = new Uint8Array(11 * 1024 * 1024);
      const file = new File([largeContent], 'huge.pdf', { type: 'application/pdf' });
      await expect(
        resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file)
      ).rejects.toThrow('Quota Exceeded');
    });

    it('should accept valid image types', async () => {
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const result = await resourceService.uploadResource(
        'CSE', '4', 'A', 'DBMS', 'Lecture Notes', file
      );
      expect(result.id).toBeDefined();
    });

    it('should store metadata in searchKeywords', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = await resourceService.uploadResource(
        'CSE', '4', 'A', 'DBMS', 'Lecture Notes', file
      );
      expect(result.searchKeywords).toContain('test.pdf');
      expect(result.searchKeywords).toContain('dbms');
    });
  });

  describe('deleteResource', () => {
    it('should delete a resource by id', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const uploaded = await resourceService.uploadResource(
        'CSE', '4', 'A', 'DBMS', 'Lecture Notes', file
      );

      const before = resourceService.getResources('CSE', '4', 'A', 'All', 'All');
      expect(before.length).toBe(1);

      await resourceService.deleteResource(uploaded.id);

      const after = resourceService.getResources('CSE', '4', 'A', 'All', 'All');
      expect(after.length).toBe(0);
    });
  });

  describe('searchGlobalResources', () => {
    it('should find resources by title', async () => {
      const file = new File(['test'], 'DBMS Notes.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file);

      const results = await resourceService.searchGlobalResources('DBMS');
      expect(results.length).toBe(1);
    });

    it('should return empty for no matches', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file);

      const results = await resourceService.searchGlobalResources('NONEXISTENT');
      expect(results).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const file = new File(['test'], 'Notes.pdf', { type: 'application/pdf' });
      await resourceService.uploadResource('CSE', '4', 'A', 'DBMS', 'Lecture Notes', file);

      const results = await resourceService.searchGlobalResources('notes');
      expect(results.length).toBe(1);
    });
  });
});
