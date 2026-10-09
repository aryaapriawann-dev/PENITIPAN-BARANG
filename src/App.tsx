import React, { useState } from 'react';
import { Header } from './components/Header';
import { ArchitectureView } from './components/ArchitectureView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ApiSpecView } from './components/ApiSpecView';
import { FolderStructureView } from './components/FolderStructureView';
import { CodeViewer } from './components/CodeViewer';
import { SimulatorView } from './components/SimulatorView';
import { SecurityBestPracticesView } from './components/SecurityBestPracticesView';
import { UserRole } from './types/jastip';
import { Server, Database, Zap, Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('architecture');
  const [activeRole, setActiveRole] = useState<UserRole>('penitip');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'database' && <DatabaseSchemaView />}
        {activeTab === 'apispec' && <ApiSpecView />}
        {activeTab === 'folders' && <FolderStructureView />}
        {activeTab === 'code' && <CodeViewer />}
        {activeTab === 'simulator' && (
          <SimulatorView
            currentRole={activeRole}
            setCurrentRole={setActiveRole}
          />
        )}
        {activeTab === 'security' && <SecurityBestPracticesView />}
      </main>

      {/* Footer System Specs */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">Jastip Hub Architecture</span>
            <span>&bull;</span>
            <span>Production Blueprint &amp; Interactive Simulator</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600">
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3 text-emerald-600" />
              Django 5.1 (Core)
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-sky-600" />
              Golang 1.23 (Gin Tracking)
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-indigo-600" />
              PostgreSQL 16 + Redis 7
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
