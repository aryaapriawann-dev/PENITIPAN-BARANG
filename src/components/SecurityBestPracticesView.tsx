import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Terminal, 
  Server, 
  FileCheck2, 
  AlertTriangle, 
  Check, 
  Copy, 
  Database, 
  Key, 
  Cpu
} from 'lucide-react';

export const SecurityBestPracticesView: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const deployCommands = `# 1. Clone repositori & konfigurasi environment
git clone https://github.com/company/jastip-platform.git
cd jastip-platform
cp .env.example .env

# 2. Build dan jalankan seluruh container (Django, Golang, Postgres, Redis, Nginx)
docker compose up -d --build

# 3. Jalankan migrasi database PostgreSQL di Django Core
docker compose exec backend-django python manage.py migrate

# 4. Buat Superuser untuk Dashboard Admin Django
docker compose exec backend-django python manage.py createsuperuser

# 5. Verifikasi status kesehatan container
docker compose ps`;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Panduan Deployment, Keamanan & Best Practices Produksi
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Standar industri perbankan & fintech untuk perlindungan dana Escrow Rekber, otorisasi RBAC, dan orkestrasi container.
          </p>
        </div>
      </div>

      {/* Security Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Escrow Concurrency & Row Locking */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                1. Pencegahan Double-Spending & Race Condition
              </h4>
              <span className="text-[11px] text-slate-500">
                PostgreSQL SELECT FOR UPDATE & @transaction.atomic
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pada sistem Escrow, resiko terbesar adalah saat dua request pembayaran atau penarikan dana terjadi secara paralel. Django menyelesaikan ini dengan <strong>Row-Level Locking</strong> pada tabel <code>Order</code> dan <code>PaymentEscrow</code>:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
            <pre>{`@transaction.atomic
def release_escrow(order_id, user):
    # Mengunci baris di PostgreSQL sampai transaksi commit
    order = Order.objects.select_for_update().get(id=order_id)
    if order.status != Order.Status.ARRIVED_LOCAL:
        raise InvalidStateError()
    ...`}</pre>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
            &bull; Mencegah pelepasan dana ganda jika tombol diklik berulang kali oleh user atau jaringan lambat.
          </div>
        </div>

        {/* Pillar 2: Webhook HMAC Signature */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                2. Otentikasi Webhook Berbasis HMAC-SHA256
              </h4>
              <span className="text-[11px] text-slate-500">
                Integrasi Payment Gateway & Ekspedisi Kurir Lokal
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Endpoint webhook (Midtrans/Xendit & kurir JNE/SiCepat) bersifat publik tanpa sesi login. Untuk mencegah spoofing (pemalsuan data sukses bayar), microservice Golang memverifikasi header <code>X-Signature</code>:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg text-indigo-300 font-mono text-xs overflow-x-auto">
            <pre>{`mac := hmac.New(sha256.New, []byte(secretKey))
mac.Write(rawBodyBytes)
expectedSig := hex.EncodeToString(mac.Sum(nil))

if subtle.ConstantTimeCompare([]byte(headerSig), []byte(expectedSig)) != 1 {
    return c.AbortWithStatus(401)
}`}</pre>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
            &bull; Menggunakan <code>ConstantTimeCompare</code> untuk mencegah serangan timing attack kriptografi.
          </div>
        </div>

        {/* Pillar 3: Role-Based Access Control (RBAC) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                3. Otorisasi Ketat Multi-Role (RBAC)
              </h4>
              <span className="text-[11px] text-slate-500">
                Custom DRF Permissions & Golang JWT Claims
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sistem memisahkan batasan hak akses antar peran pengguna secara tegas:
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
            <li><strong>Penitip:</strong> Hanya berhak membuat request titip, memilih traveller, dan melepaskan escrow milik order sendiri.</li>
            <li><strong>Traveller:</strong> Wajib KYC KTP terverifikasi sebelum dapat membuat listing Trip penerbangan atau mengunggah nota pembelian.</li>
            <li><strong>Admin:</strong> Memiliki akses mediasi dispute/sengketa jika barang rusak atau tidak sesuai deskripsi.</li>
          </ul>
        </div>

        {/* Pillar 4: S3 Presigned URL & Anti-Malware */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                4. Validasi Upload Struk Belanja & Presigned S3
              </h4>
              <span className="text-[11px] text-slate-500">
                Direct Upload Tanpa Membebani Server RAM
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Foto struk belanja dan KTP tidak dikirim langsung membebani bandwidth backend. Golang menghasilkan URL bertanda tangan (Presigned S3 PUT):
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
            <li>Validasi tipe MIME hanya menerima <code>image/jpeg</code>, <code>image/png</code>, atau <code>image/webp</code>.</li>
            <li>Batas ukuran file maksimal 5 MB dengan masa berlaku URL hanya 5 menit.</li>
            <li>File KTP disimpan di private S3 bucket terenkripsi SSE-S3.</li>
          </ul>
        </div>
      </div>

      {/* Production Deployment Guide with Docker Compose */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Panduan Menjalankan Lingkungan Produksi (Docker Compose)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Langkah-langkah inisialisasi kontainer backend Django, microservice Golang, database PostgreSQL, dan Redis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('deploy', deployCommands)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-xs"
          >
            {copied === 'deploy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'deploy' ? 'Tersalin!' : 'Salin Perintah'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
          <pre>{deployCommands}</pre>
        </div>
      </div>
    </div>
  );
};
