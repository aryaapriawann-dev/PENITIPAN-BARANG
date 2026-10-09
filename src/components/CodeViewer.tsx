import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FileText,
  Terminal
} from 'lucide-react';
import { CODE_SNIPPETS, CodeFile } from '../data/codeSnippets';

export const CodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(CODE_SNIPPETS[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (file: CodeFile) => {
    const element = document.createElement('a');
    const blob = new Blob([file.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = file.filename.split('/').pop() || 'code.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Implementasi Kode Backend Produksi (DRF & Golang)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Kode clean code lengkap dengan validasi serializer, matching engine, escrow concurrency-safe, dan Gin handler performa tinggi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(selectedFile.code)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Kode File Ini'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownload(selectedFile)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* File Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CODE_SNIPPETS.map((item) => {
          const isSelected = selectedFile.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedFile(item)}
              className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-mono border whitespace-nowrap transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.filename.split('/').pop()}</span>
            </button>
          );
        })}
      </div>

      {/* Code Card Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Code Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {selectedFile.filename}
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {selectedFile.language.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedFile.description}
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400 self-end sm:self-auto">
            {selectedFile.code.split('\n').length} lines
          </div>
        </div>

        {/* Code Content */}
        <div className="p-5 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[650px] overflow-y-auto">
          <pre>{selectedFile.code}</pre>
        </div>
      </div>
    </div>
  );
};
