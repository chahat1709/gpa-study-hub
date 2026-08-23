import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  ExternalLink,
  Video,
  ChevronRight,
  Globe,
  Loader2,
  Filter,
  Clock,
  Folder,
} from 'lucide-react';
import { LibraryResource } from '../../types';
import { academicService } from '../../services/academicService';
import { generateTextContent } from '../../services/aiProviderService';
import { useToast } from '../../components/ToastProvider';

interface LibraryViewProps {
  userMetadata: {
    branch: string;
    semester: string;
    section: string;
  };
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  resources: LibraryResource[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({
  userMetadata,
  selectedSubject,
  setSelectedSubject,
  selectedCategory,
  setSelectedCategory,
  resources,
  searchQuery,
  setSearchQuery,
}) => {
  const subjects = academicService.getSubjects();
  const categories = academicService.getCategories();
  const { info, success } = useToast();
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<string | null>(null);

  const handleAIResearch = async () => {
    setIsResearching(true);
    setResearchResult(null);
    info(`Searching academic database for ${selectedSubject}...`);
    try {
      const prompt = `Provide an academic summary and key topics for ${selectedSubject} specifically for a ${userMetadata.branch} student in Semester ${userMetadata.semester}. Include recommended online study URLs.`;
      const result = await generateTextContent(prompt);
      setResearchResult(result);
      success('Research Complete');
    } catch (e) {
      setResearchResult('Connection interrupted. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-white">
      {/* Top Filter Bar */}
      <div className="shrink-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-6 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-7xl mx-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setResearchResult(null);
              }}
              className={`whitespace-nowrap px-4 py-2 min-h-[44px] rounded-full text-xs font-medium transition-all flex items-center ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Sidebar Subject List */}
        <div className="w-64 bg-white/5 border-r border-white/10 shrink-0 hidden md:flex flex-col overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 px-2">
              Subjects
            </h3>
            <div className="space-y-1">
              {subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSubject(sub);
                    setResearchResult(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg transition-colors text-sm font-medium ${
                    selectedSubject === sub
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{sub}</span>
                  {selectedSubject === sub && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden glass-card border border-white/10 text-white shadow-2xl">
          <div className="p-6 md:p-8 shrink-0 border-b border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedSubject}</h2>
                <p className="text-sm text-slate-300 mt-1">
                  {resources.length} resources in {selectedCategory}
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {researchResult ? (
              <div className="glass-card rounded-2xl p-8 border border-white/10 text-white shadow-2xl animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white">AI Research Summary</h3>
                </div>
                <div className="prose prose-invert max-w-none text-sm">
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-100">
                    {researchResult}
                  </p>
                </div>
                <button
                  onClick={() => setResearchResult(null)}
                  className="mt-8 text-sm font-medium text-indigo-400 hover:text-indigo-300 p-3 min-h-[44px] flex items-center"
                >
                  ← Back to Resources
                </button>
              </div>
            ) : resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(res => (
                  <div
                    key={res.id}
                    className="group p-5 rounded-xl border border-white/10 hover:border-indigo-400 hover:shadow-xl transition-all glass-card text-white flex flex-col"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`p-3 rounded-lg ${
                          res.type === 'pdf'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : res.type === 'video'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {res.type === 'pdf' ? (
                          <FileText className="w-6 h-6" />
                        ) : res.type === 'video' ? (
                          <Video className="w-6 h-6" />
                        ) : (
                          <ExternalLink className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Display Tag (Unit or Year) if available */}
                        {res.unit && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded mb-1.5">
                            {res.unit}
                          </span>
                        )}
                        {res.academicYear && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded mb-1.5">
                            {res.academicYear}
                          </span>
                        )}
                        {res.deadline && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded mb-1.5">
                            <Clock className="w-2 h-2" /> Due: {res.deadline}
                          </span>
                        )}

                        <h4 className="font-semibold text-white text-sm truncate mb-1 group-hover:text-indigo-400 transition-colors">
                          {res.title}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          {res.uploadDate} • {res.size || '1.2 MB'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-white/10">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 min-h-[44px] bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="font-bold text-white mb-2">No resources found</h3>
                <p className="text-sm text-slate-300 max-w-xs mx-auto mb-8">
                  We couldn't find any materials for this subject in the {selectedCategory} section.
                </p>
                <button
                  onClick={handleAIResearch}
                  disabled={isResearching}
                  className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                >
                  {isResearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {isResearching ? 'Analyzing...' : 'Generate AI Study Guide'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryView;
