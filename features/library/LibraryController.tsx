
import React, { useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import { resourceService } from '../../services/resourceService';
import { academicService } from '../../services/academicService';
import { Subject, Category } from '../../types';
import LibraryView from './LibraryView';

const LibraryController: React.FC = () => {
  const { user } = useAuth();
  
  const subjects = academicService.getSubjects();
  const categories = academicService.getCategories();
  
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] || 'Maths');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'Syllabus');
  const [searchQuery, setSearchQuery] = useState('');

  // Critical: Extract student identity for resource isolation
  const studentBranch = user?.branch || 'EC';
  const studentSemester = user?.semester || '1';
  const studentSection = user?.section || 'All';

  // Fetches targeted content: (Specific Section) + (Semester Universal)
  const resources = resourceService.getResources(
    studentBranch,
    studentSemester,
    studentSection,
    selectedSubject as Subject,
    selectedCategory as Category
  );

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LibraryView 
      userMetadata={{ branch: studentBranch, semester: studentSemester, section: studentSection }}
      selectedSubject={selectedSubject}
      setSelectedSubject={setSelectedSubject}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      resources={filteredResources}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
  );
};

export default LibraryController;
