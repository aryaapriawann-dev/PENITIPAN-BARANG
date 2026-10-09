import React, { useState } from 'react';
import { 
  FolderTree, 
  Folder, 
  File, 
  Copy, 
  Check, 
  Layers, 
  Info,
  ChevronRight,
  Code
} from 'lucide-react';
import { PROJECT_FOLDER_STRUCTURE } from '../data/architectureData';

export const FolderStructureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'django' | 'golang'>('django');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const djangoHighlights = [
    {
      dir: 'apps/authentication/',
      title: 'Domain Pengguna & Otorisasi',
      desc: 'Membungkus logic registrasi Penitip dan Traveller, profil KTP terverifikasi, rating ulasan, dan saldo dompet.'
    },
    {
      dir: 'apps/trips/',
      title: 'Domain Rute Penerbangan Traveller',
      desc: 'Menyimpan jadwal perjalanan, asal/tujuan negara, kuota bagasi (kg), dan kalkulasi tarif.'
    },
    {
      dir: 'apps/requests/',
      title: 'Domain Permintaan Titipan & Matching',
      desc: 'CRUD request barang belanjaan dan algoritma matching engine yang mencocokkan rute & bagasi traveller secara otomatis.'
    },
    {
      dir: 'apps/orders/ & apps/escrow/',
      title: 'Domain Kontrak & Rekber (Escrow)',
      desc: 'Menjamin keamanan finansial. Mengunci dana secara atomik dengan SELECT FOR UPDATE dan melepaskan saldo saat barang terverifikasi.'
    },
    {
      dir: 'utils/event_bus.py',
      title: 'Event Publisher ke Redis Pub/Sub',
      desc: 'Menerbitkan event perubahan status order (ESCROW_LOCKED, ORDER_CONFIRMED) agar di-stream oleh service Golang.'
    }
  ];

  const golangHighlights = [
    {
      dir: 'cmd/server/main.go',
      title: 'Application Entry Point',
      desc: 'Inisialisasi pool koneksi PostgreSQL (100 conns), Redis client, WebSocket hub goroutine, dan Gin web engine.'
    },
    {
      dir: 'internal/delivery/http/',
      title: 'High-Throughput HTTP Handlers',
      desc: 'Handler Gin untuk telemetri log pelacakan barang, upload nota pembelian via S3, dan verifikasi HMAC webhook kurir lokal.'
    },
    {
      dir: 'internal/delivery/websocket/',
      title: 'Bi-directional WebSocket Hub',
      desc: 'Mengelola koneksi persisten client browser/mobile per OrderID untuk live streaming pergerakan status tanpa polling berkala.'
    },
    {
      dir: 'internal/service/event_subscriber.go',
      title: 'Redis Pub/Sub Subscriber Goroutine',
      desc: 'Mendengarkan event dari Django Core secara real-time dan langsung meneruskannya ke WebSocket client.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Struktur Folder Proyek Modular & Clean Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Pemisahan domain yang bersih, teruji, dan siap skala besar (Production Ready).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('django')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'django'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Backend Django (Core)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('golang')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'golang'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Microservice Golang (Tracking)
          </button>
        </div>
      </div>

      {/* Grid: Tree on Left, Architecture Highlights on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tree Viewer */}
        <div className="lg:col-span-7 bg-slate-950 rounded-xl p-5 text-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <span className="text-xs font-mono text-indigo-400">
              {activeTab === 'django' ? 'backend-django/' : 'microservice-golang/'}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(activeTab === 'django' ? PROJECT_FOLDER_STRUCTURE.django : PROJECT_FOLDER_STRUCTURE.golang)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Tree'}</span>
            </button>
          </div>

          <pre className="font-mono text-xs leading-relaxed overflow-x-auto text-slate-300">
            {activeTab === 'django' ? PROJECT_FOLDER_STRUCTURE.django : PROJECT_FOLDER_STRUCTURE.golang}
          </pre>
        </div>

        {/* Right: Highlights & Explanation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>
                {activeTab === 'django' ? 'Arsitektur Domain Django Apps' : 'Arsitektur Internal Golang'}
              </span>
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {activeTab === 'django'
                ? 'Django mengadopsi pola "Plug-and-play Modular Apps" di mana tiap modul bisnis (auth, trips, requests, orders, escrow) memiliki models, serializers, views, dan permissions tersendiri yang terisolasi.'
                : 'Golang mengadopsi "Standard Go Project Layout" dengan clean separation: domain, repository (data layer), service (business logic), dan delivery (HTTP Gin & WebSocket Hub).'}
            </p>

            <div className="space-y-3">
              {(activeTab === 'django' ? djangoHighlights : golangHighlights).map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="text-xs font-mono font-bold text-slate-900 mb-0.5">
                    {item.dir}
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 mb-1">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-600 leading-normal">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
