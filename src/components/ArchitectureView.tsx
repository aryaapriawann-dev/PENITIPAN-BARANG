import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  Activity, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Zap, 
  RefreshCw,
  Radio,
  FileCheck2,
  Lock
} from 'lucide-react';
import { SYSTEM_SERVICES } from '../data/architectureData';

export const ArchitectureView: React.FC = () => {
  const [selectedFlowStep, setSelectedFlowStep] = useState<number>(0);

  const flowSteps = [
    {
      step: 1,
      title: 'Permintaan & Pencocokan (DRF)',
      actor: 'Shopper & Traveller',
      service: 'Django REST Framework',
      desc: 'Shopper memposting request titip barang (misal: Skincare dari Ginza Tokyo). Sistem Matching Engine di Django mencocokkan rute penerbangan & sisa bagasi Traveller.',
      icon: Layers
    },
    {
      step: 2,
      title: 'Kesepakatan & Escrow Lock (Atomik)',
      actor: 'Shopper -> Payment Gateway',
      service: 'Django Escrow Service',
      desc: 'Order dibuat. Shopper mentransfer dana ke Rekber. Transaksi database atomik (SELECT FOR UPDATE) mengunci dana di PaymentEscrow. Event diterbitkan ke Redis Pub/Sub.',
      icon: Lock
    },
    {
      step: 3,
      title: 'Pembelian & Upload Nota (Golang)',
      actor: 'Traveller di Luar Negeri',
      service: 'Golang Tracking Service',
      desc: 'Traveller membeli barang di Tokyo, mengambil foto struk asli, lalu mengirimkan payload ke handler Golang (sub-5ms) untuk disimpan ke database dan broadcast.',
      icon: Zap
    },
    {
      step: 4,
      title: 'Real-time Flight & Tracking (WebSocket)',
      actor: 'Sistem & Traveller',
      service: 'Golang WebSocket Hub',
      desc: 'Milestone status (Boarding pesawat, Mendarat di Bandara CGK, Diserahkan ke ekspedisi lokal) di-stream langsung ke layar HP Shopper via WebSocket 2-arah.',
      icon: Radio
    },
    {
      step: 5,
      title: 'Verifikasi & Pencairan Dana (DRF)',
      actor: 'Shopper -> Traveller Wallet',
      service: 'Django Core Escrow',
      desc: 'Barang diterima dan diverifikasi sesuai pesanan. Shopper klik Konfirmasi. Escrow melepaskan saldo secara instan ke dompet penarikan Traveller.',
      icon: FileCheck2
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Overview */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-indigo-300 mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Hybrid Architecture: Django Core + Golang Microservice</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Arsitektur Sistem Platform Titip Beli (Jastip)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Platform didesain modular memisahkan <strong className="text-white">Core Business Domain (Django)</strong> yang membutuhkan integritas relasional tinggi, validasi ORM matang, serta model Escrow rekber, dengan <strong className="text-white">High-Throughput Ingestion (Golang Gin)</strong> untuk telemetri pelacakan status barang berlatensi rendah, WebSocket realtime, dan penanganan webhook ekspedisi.
          </p>
        </div>

        {/* Decorative Grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Visual Architectural Map Diagram */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Peta Komponen & Alur Komunikasi Sistem
            </h3>
            <p className="text-xs text-slate-500">
              Sinkronisasi data multi-service melalui REST API, PostgreSQL shared storage, dan Redis Pub/Sub Event Bus
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            Protocol: REST / WebSocket / PubSub
          </span>
        </div>

        {/* Visual Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Frontend Client */}
          <div className="lg:col-span-3 border border-slate-200 bg-slate-50/50 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Client Tier
                </span>
                <span className="text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-mono">
                  Port 3000 / App
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Web SPA & Mobile App
              </h4>
              <p className="text-xs text-slate-600 mb-4">
                React 19 / Flutter App untuk Penitip & Traveller.
              </p>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <strong>Shopper Portal:</strong> Request barang, pilih rute traveller, bayar rekber.
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <strong>Traveller App:</strong> Update lokasi, upload foto nota, broadcast rute bagasi.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Dual Gateway Request</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Microservices Cluster */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Django Service */}
            <div className="border-2 border-emerald-500/20 bg-emerald-50/30 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Core Authority
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700">Port 8000</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Django REST Core
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  Python 3.12 + Django REST Framework
                </p>
                <ul className="text-xs text-slate-700 space-y-1.5 mb-3">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>JWT Auth, Profile & KYC</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Request Titipan & Trip Listing</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Geographic Matching Engine</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Atomic Escrow Lock Engine</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60 text-[11px] text-emerald-900 font-mono">
                Publishes: <span className="text-emerald-700 font-semibold">order:events</span>
              </div>
            </div>

            {/* Golang Service */}
            <div className="border-2 border-sky-500/20 bg-sky-50/30 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                    High Throughput
                  </span>
                  <span className="text-[11px] font-mono text-sky-700">Port 8080</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Golang Tracking Service
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  Go 1.23 + Gin Framework & Goroutines
                </p>
                <ul className="text-xs text-slate-700 space-y-1.5 mb-3">
                  <li className="flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                    <span>Sub-5ms Event Ingestion</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                    <span>Bi-directional WebSocket Hub</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                    <span>S3 Receipt Photo Signer</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                    <span>HMAC Courier Webhook Handler</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-sky-200/60 text-[11px] text-sky-900 font-mono">
                Subscribes: <span className="text-sky-700 font-semibold">order:events</span>
              </div>
            </div>
          </div>

          {/* Database & Message Broker */}
          <div className="lg:col-span-3 border border-slate-200 bg-slate-50/50 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Data & Event Tier
                </span>
                <span className="text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-mono">
                  ACID + In-Memory
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                PostgreSQL & Redis
              </h4>
              <p className="text-xs text-slate-600 mb-4">
                Pondasi konsistensi data finansial & pub/sub cepat.
              </p>

              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>PostgreSQL 16</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Tables: Users, Trips, Requests, Orders, Escrow, TrackingEvents. Row locking untuk Escrow.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <Activity className="w-3.5 h-3.5 text-red-500" />
                    <span>Redis 7.2 Broker</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Kanal Pub/Sub event, session cache, dan distributed rate limiter.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              Network: Internal Docker Bridge
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Transaction Lifecycle */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Alur End-to-End Transaksi Titip Beli & Escrow Rekber
          </h3>
          <p className="text-xs text-slate-500">
            Klik tahapan di bawah untuk melihat bagaimana Django dan Golang berkolaborasi menjaga integritas pesanan
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          {flowSteps.map((s, idx) => {
            const Icon = s.icon;
            const isSelected = selectedFlowStep === idx;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setSelectedFlowStep(idx)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Langkah 0{s.step}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                </div>
                <div className="text-xs font-semibold line-clamp-1">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Step Detail Box */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                Service: {flowSteps[selectedFlowStep].service}
              </span>
              <span className="text-xs text-slate-500">
                Aktor: {flowSteps[selectedFlowStep].actor}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {flowSteps[selectedFlowStep].title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {flowSteps[selectedFlowStep].desc}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFlowStep((prev) => (prev > 0 ? prev - 1 : flowSteps.length - 1))}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-100 text-slate-700"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setSelectedFlowStep((prev) => (prev < flowSteps.length - 1 ? prev + 1 : 0))}
              className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 shadow-xs"
            >
              Langkah Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Services Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SYSTEM_SERVICES.map((srv, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-base font-bold text-slate-900">
                  {srv.name}
                </h4>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {srv.techStack.split(',')[0]}
                </span>
              </div>
              <p className="text-xs font-medium text-indigo-600 mb-3">
                {srv.role}
              </p>
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Tanggung Jawab Utama:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {srv.responsibilities.map((r, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Komunikasi:</span> {srv.communication}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
