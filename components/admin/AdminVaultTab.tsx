import React, { useRef } from 'react';
import {
  FileUp,
  Upload,
  Loader2,
  Search,
  Filter,
  Database,
  Globe2,
  FileText,
  Trash2,
  Download,
  Layers,
} from 'lucide-react';
import { LibraryResource } from '../../types';

interface AdminVaultTabProps {
  subjects: string[];
  categories: string[];
  uploadSubject: string;
  setUploadSubject: (v: string) => void;
  uploadCategory: string;
  setUploadCategory: (v: string) => void;
  uploadUnit: string;
  setUploadUnit: (v: string) => void;
  uploadYear: string;
  setUploadYear: (v: string) => void;
  uploadDeadline: string;
  setUploadDeadline: (v: string) => void;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  vaultSearch: string;
  setVaultSearch: (v: string) => void;
  filteredUploads: LibraryResource[];
  onDeleteResource: (id: string) => void;
  onRefresh: () => void;
}

export const AdminVaultTab: React.FC<AdminVaultTabProps> = ({
  subjects,
  categories,
  uploadSubject,
  setUploadSubject,
  uploadCategory,
  setUploadCategory,
  uploadUnit,
  setUploadUnit,
  uploadYear,
  setUploadYear,
  uploadDeadline,
  setUploadDeadline,
  isUploading,
  onFileUpload,
  vaultSearch,
  setVaultSearch,
  filteredUploads,
  onDeleteResource,
  onRefresh,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">
      <div className="glass-card bg-slate-900/60 rounded-[32px] border border-white/10 p-6 lg:p-8 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <FileUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Upload Vault</h3>
            <p className="text-xs text-slate-400">Add materials to library</p>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6 flex-1">
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3 h-3" /> Targeting
            </label>
            <div className="grid grid-cols-1 gap-4">
              <select
                value={uploadSubject}
                onChange={e => setUploadSubject(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="" className="bg-slate-900 text-white">
                  Select Subject...
                </option>
                {subjects.map(s => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="" className="bg-slate-900 text-white">
                  Select Category...
                </option>
                {categories.map(c => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`space-y-4 transition-all ${uploadCategory ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
          >
            {(uploadCategory === 'Lecture Notes' || uploadCategory === 'Syllabus') && (
              <input
                value={uploadUnit}
                onChange={e => setUploadUnit(e.target.value)}
                placeholder="Unit / Module Name"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
              />
            )}
            {uploadCategory === 'Question Papers' && (
              <input
                value={uploadYear}
                onChange={e => setUploadYear(e.target.value)}
                placeholder="Academic Year (e.g. Winter 2023)"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
              />
            )}
            {uploadCategory === 'Assignments' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  type="date"
                  value={uploadDeadline}
                  onChange={e => setUploadDeadline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
          </div>

          <div className="mt-auto pt-6">
            <label
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isUploading ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/20 hover:border-indigo-400 hover:bg-white/5'}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                )}
                <p className="text-sm font-bold text-slate-300">
                  {isUploading ? 'Securing...' : 'Drop File Here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX (Max 10MB)</p>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={onFileUpload} />
            </label>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 glass-card bg-slate-900/60 rounded-[32px] border border-white/10 flex flex-col overflow-hidden shadow-sm min-h-[500px]">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center bg-white/5 sticky top-0 z-10 gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={vaultSearch}
              onChange={e => setVaultSearch(e.target.value)}
              placeholder="Search Library..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400">{filteredUploads.length} items</span>
            <button
              onClick={onRefresh}
              className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/5">
          {filteredUploads.map(res => (
            <div
              key={res.id}
              className="group p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:border-indigo-500/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${res.type === 'pdf' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}
                >
                  {res.type === 'pdf' ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <Globe2 className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{res.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {res.category}
                    </span>
                    <span className="text-xs text-slate-400">• {res.subject}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onDeleteResource(res.id)}
                  className="p-3 min-h-[44px] min-w-[44px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-3 min-h-[44px] min-w-[44px] text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredUploads.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold text-sm">No resources found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
