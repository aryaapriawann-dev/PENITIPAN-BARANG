import React, { useState } from 'react';
import { 
  FileCode, 
  Send, 
  Check, 
  Copy, 
  Key, 
  Globe, 
  Zap, 
  Lock, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { API_ENDPOINTS } from '../data/apiSpecsData';
import { ApiEndpoint } from '../types/jastip';

export const ApiSpecView: React.FC = () => {
  const [selectedService, setSelectedService] = useState<'ALL' | 'Django (Core)' | 'Golang (Real-time Tracking)'>('ALL');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [simulatedResponse, setSimulatedResponse] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const filteredEndpoints = API_ENDPOINTS.filter((ep) => {
    if (selectedService === 'ALL') return true;
    return ep.service === selectedService;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setSimulatedResponse(null);
    const mockLatency = selectedEndpoint.service.includes('Golang') 
      ? Math.floor(Math.random() * 4) + 1.8 
      : Math.floor(Math.random() * 25) + 35;

    setTimeout(() => {
      setLatencyMs(mockLatency);
      setSimulatedResponse(selectedEndpoint.responseBody);
      setIsExecuting(false);
    }, 400);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'POST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              API Specification & Interactive Explorer
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Daftar kontrak antarmuka REST API & WebSocket untuk Django Core Authority & Golang Microservice.
          </p>
        </div>

        {/* Service Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSelectedService('ALL')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedService === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Semua Service ({API_ENDPOINTS.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedService('Django (Core)')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedService === 'Django (Core)'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Django Core
          </button>
          <button
            type="button"
            onClick={() => setSelectedService('Golang (Real-time Tracking)')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedService === 'Golang (Real-time Tracking)'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Golang Tracking
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Endpoints List & Detail Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Endpoints Menu */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
            Daftar Endpoint ({filteredEndpoints.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredEndpoints.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    setSimulatedResponse(null);
                  }}
                  className={`w-full p-3.5 text-left transition-colors flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getMethodBadge(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-900 truncate">
                        {ep.path}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate">
                      {ep.summary}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{ep.service}</span>
                      {ep.authRequired && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <Lock className="w-2.5 h-2.5" /> Auth
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 mt-2 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Endpoint Detail & Interactive Sandbox */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-6 p-6">
          {/* Header Info */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {selectedEndpoint.service}
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getMethodBadge(selectedEndpoint.method)}`}>
                {selectedEndpoint.method}
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 font-mono break-all mb-1">
              {selectedEndpoint.path}
            </h4>
            <p className="text-xs font-semibold text-indigo-700 mb-1">
              {selectedEndpoint.summary}
            </p>
            <p className="text-xs text-slate-600">
              {selectedEndpoint.description}
            </p>
          </div>

          {/* Security & Headers */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Otorisasi:</span>
              <span className="font-mono font-medium text-slate-900">
                {selectedEndpoint.authRequired ? 'Bearer <JWT Access Token>' : 'Publik (No Auth)'}
              </span>
            </div>
            {selectedEndpoint.requiredRole && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Role Diizinkan:</span>
                <span className="font-mono text-indigo-700 font-semibold uppercase">
                  {selectedEndpoint.requiredRole}
                </span>
              </div>
            )}
          </div>

          {/* Request Body (if applicable) */}
          {selectedEndpoint.requestBody && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Request Body (application/json)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedEndpoint.requestBody || '')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Salin
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-200 overflow-x-auto">
                <pre>{selectedEndpoint.requestBody}</pre>
              </div>
            </div>
          )}

          {/* Interactive Trigger Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Mengirim Request...' : 'Coba Eksekusi Endpoint (Try it out)'}</span>
            </button>
            {latencyMs > 0 && (
              <span className="text-xs font-mono text-emerald-600 font-medium">
                Respon diterima dalam {latencyMs} ms
              </span>
            )}
          </div>

          {/* Response Payload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Response</span>
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded">
                  HTTP {selectedEndpoint.statusCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(simulatedResponse || selectedEndpoint.responseBody)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-[300px]">
              <pre>{simulatedResponse || selectedEndpoint.responseBody}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
