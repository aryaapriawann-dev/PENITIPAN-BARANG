import React from 'react';
import { 
  Server, 
  Database, 
  FileCode, 
  FolderTree, 
  Code2, 
  PlayCircle, 
  ShieldCheck, 
  Plane, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { UserRole } from '../types/jastip';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeRole,
  setActiveRole
}) => {
  const tabs = [
    { id: 'architecture', label: 'Arsitektur Sistem', icon: Server },
    { id: 'database', label: 'Skema Database (ERD)', icon: Database },
    { id: 'apispec', label: 'Spesifikasi API', icon: FileCode },
    { id: 'folders', label: 'Struktur Folder', icon: FolderTree },
    { id: 'code', label: 'Kode DRF & Go', icon: Code2 },
    { id: 'simulator', label: 'Live Simulator Titip', icon: PlayCircle },
    { id: 'security', label: 'Keamanan & Deploy', icon: ShieldCheck }
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold tracking-tight shadow-sm">
            <Plane className="w-5 h-5 text-indigo-400 rotate-[-25deg]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Jastip Hub
              </h1>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Enterprise Blueprint & Simulator
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Django Core + Golang Microservice Tracking + PostgreSQL & Redis
            </p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Simulasi Peran:</span>
          </div>
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveRole('penitip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeRole === 'penitip'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
              <span>Penitip (Shopper)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('traveller')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeRole === 'traveller'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-sky-500" />
              <span>Traveller (Jastiper)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeRole === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Escrow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
