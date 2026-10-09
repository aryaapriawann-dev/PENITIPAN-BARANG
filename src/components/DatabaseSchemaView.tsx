import React, { useState } from 'react';
import { 
  Database, 
  Code, 
  Table, 
  ArrowRight, 
  Copy, 
  Check, 
  Layers, 
  Key, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { DJANGO_MODELS } from '../data/architectureData';
import { DatabaseModel } from '../types/jastip';

export const DatabaseSchemaView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<DatabaseModel>(DJANGO_MODELS[0]);
  const [viewMode, setViewMode] = useState<'fields' | 'django' | 'sql'>('fields');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSqlDdl = (model: DatabaseModel) => {
    return `-- PostgreSQL 16 DDL for ${model.tableName}
CREATE TABLE ${model.tableName} (
${model.fields
  .map((f) => {
    let pgType = 'VARCHAR(255)';
    if (f.type.includes('UUID')) pgType = 'UUID DEFAULT gen_random_uuid() PRIMARY KEY';
    else if (f.type.includes('Decimal')) pgType = 'NUMERIC(14, 2)';
    else if (f.type.includes('Integer')) pgType = 'INTEGER';
    else if (f.type.includes('Boolean')) pgType = 'BOOLEAN DEFAULT FALSE';
    else if (f.type.includes('DateField')) pgType = 'DATE';
    else if (f.type.includes('DateTimeField')) pgType = 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP';
    else if (f.type.includes('TextField')) pgType = 'TEXT';
    else if (f.type.includes('JSON')) pgType = 'JSONB DEFAULT \'[]\'::jsonb';
    else if (f.type.includes('ForeignKey')) pgType = 'UUID REFERENCES ... ON DELETE CASCADE';

    return `    ${f.name.padEnd(22)} ${pgType} /* ${f.constraints} */`;
  })
  .join(',\n')}
);

-- Indeks Performa
CREATE INDEX idx_${model.tableName.replace('.', '_')}_created ON ${model.tableName} (created_at DESC);`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Skema Database Relasional & ERD (Django Models)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Didesain menggunakan standar PostgreSQL 16 dengan Foreign Keys, Check Constraints, Row-Level Locking, dan Indeks B-Tree.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('fields')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'fields'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Kolom & Constraint</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('django')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'django'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Django ORM (Python)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'sql'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Postgres DDL SQL</span>
          </button>
        </div>
      </div>

      {/* Model Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DJANGO_MODELS.map((model) => {
          const isSelected = selectedModel.name === model.name;
          return (
            <button
              key={model.name}
              type="button"
              onClick={() => setSelectedModel(model)}
              className={`p-3 text-left rounded-xl border transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Model
                </span>
                {model.name.includes('Escrow') && (
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                )}
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {model.name.split(' ')[0]}
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate">
                {model.tableName}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Table Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Table Header Info */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900 font-mono">
                {selectedModel.name}
              </h4>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                Table: {selectedModel.tableName}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {selectedModel.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  viewMode === 'django'
                    ? selectedModel.djangoCode
                    : viewMode === 'sql'
                    ? generateSqlDdl(selectedModel)
                    : JSON.stringify(selectedModel.fields, null, 2)
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-100 text-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Definisi'}</span>
            </button>
          </div>
        </div>

        {/* Content Body Based on Mode */}
        {viewMode === 'fields' && (
          <div className="p-5 space-y-6">
            {/* Relational Summary */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-900">
              <span className="font-bold">Koneksi Relasional (Foreign Keys):</span>{' '}
              {selectedModel.relations.join(' · ')}
            </div>

            {/* Fields Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50">
                    <th className="py-2.5 px-3 font-semibold">Nama Kolom</th>
                    <th className="py-2.5 px-3 font-semibold">Tipe Data (Django)</th>
                    <th className="py-2.5 px-3 font-semibold">Batasan & Constraint</th>
                    <th className="py-2.5 px-3 font-semibold">Fungsi Bisnis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedModel.fields.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 flex items-center gap-1.5">
                        {f.name === 'id' ? (
                          <Key className="w-3 h-3 text-amber-500" />
                        ) : null}
                        <span>{f.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-700">
                        {f.type}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {f.constraints}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {f.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'django' && (
          <div className="p-4 bg-slate-950 overflow-x-auto text-slate-200 font-mono text-xs leading-relaxed">
            <pre>{selectedModel.djangoCode}</pre>
          </div>
        )}

        {viewMode === 'sql' && (
          <div className="p-4 bg-slate-950 overflow-x-auto text-slate-200 font-mono text-xs leading-relaxed">
            <pre>{generateSqlDdl(selectedModel)}</pre>
          </div>
        )}
      </div>

      {/* ERD Entity Relationship Flow Summary */}
      <div className="bg-slate-900 rounded-xl p-5 text-white shadow-xs">
        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Integritas Relasi Antar Tabel (Entity Relationships)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700">
            <span className="font-semibold text-white block mb-1">User &larr;&rarr; Trip / Request</span>
            Penitip memposting <code>RequestTitipan</code> (1:N). Traveller mempublikasikan jadwal penerbangan <code>Trip</code> (1:N).
          </div>
          <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700">
            <span className="font-semibold text-white block mb-1">Order Binding</span>
            Tabel <code>Order</code> mengikat Shopper, Traveller, Request, dan Trip secara atomic dengan status state machine.
          </div>
          <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700">
            <span className="font-semibold text-white block mb-1">Escrow &amp; Tracking Log</span>
            <code>Order</code> dijamin 1-to-1 oleh <code>PaymentEscrow</code> dan dipantau 1-to-N oleh log cepat <code>TrackingEvent</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
