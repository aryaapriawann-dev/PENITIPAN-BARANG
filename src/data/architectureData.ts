import { DatabaseModel } from '../types/jastip';

export interface SystemService {
  name: string;
  role: string;
  techStack: string;
  responsibilities: string[];
  communication: string;
}

export const SYSTEM_SERVICES: SystemService[] = [
  {
    name: 'Core Service (Django & DRF)',
    role: 'Central Business Logic & Transactional Authority',
    techStack: 'Python 3.12, Django 5.1, Django REST Framework, Celery, SimpleJWT',
    responsibilities: [
      'Autentikasi Pengguna & Manajemen Profil (Shopper/Penitip & Carrier/Traveller)',
      'Verifikasi KYC / KTP & Sistem Reputasi / Ulasan (Review)',
      'Katalog & CRUD Permintaan Titip Barang (Request Titipan)',
      'Manajemen Rute Perjalanan Traveller (Trip & Bagasi Slot)',
      'Algoritma Matching Otomatis (Rute, Kuota Bagasi, Batas Tanggal)',
      'Order Lifecycle & Manajemen Escrow (Rekening Bersama / Safe Deposit)',
      'Emit Event Perubahan Status ke Redis Pub/Sub'
    ],
    communication: 'REST API untuk Frontend SPA; Redis Pub/Sub & gRPC client ke Golang Service; PostgreSQL via Django ORM with atomic transactions.'
  },
  {
    name: 'Tracking & Notification Service (Golang)',
    role: 'High-Concurrency Event Ingestion & Real-Time Gateway',
    techStack: 'Go 1.23, Gin / Fiber Web Framework, Gorilla WebSocket, pgx / gorm, redis-go',
    responsibilities: [
      'Ingestion log pelacakan barang dengan throughput tinggi (low latency)',
      'Push notifikasi seketika (Server-Sent Events / WebSocket) ke mobile/web client',
      'Upload & validasi metadata bukti belanja (receipt / foto struk) via S3 CDN',
      'Consume event pesanan dari Redis Pub/Sub saat status berubah di Django',
      'Webhook dispatcher ke Payment Gateway (Midtrans/Xendit) & Kurir Lokal (JNE/SiCepat)'
    ],
    communication: 'REST API & WebSockets untuk Frontend; Subscriber Redis Pub/Sub dari Django; Direct Read/Write ke PostgreSQL tracking tables.'
  },
  {
    name: 'Database & Cache Tier',
    role: 'ACID Relational Storage & In-Memory Message Broker',
    techStack: 'PostgreSQL 16 (Primary ACID Store), Redis 7.2 (Pub/Sub & Caching)',
    responsibilities: [
      'PostgreSQL: Relasional schema terpusat (Users, Trips, Requests, Orders, Escrow, Tracking Logs)',
      'Row-level locking (SELECT FOR UPDATE) untuk mencegah double-spending pada Escrow',
      'Redis: Kanal Pub/Sub order:events, tracking:events, session cache, dan distributed lock'
    ],
    communication: 'TCP Port 5432 (Postgres), Port 6379 (Redis)'
  },
  {
    name: 'Client Layer (Frontend SPA / Mobile)',
    role: 'Interactive User Experience',
    techStack: 'React 19, TypeScript, Tailwind CSS, TanStack Query, Lucide Icons',
    responsibilities: [
      'Dashboard Penitip: Buat request titip, cari trip, bayar escrow, pantau tracking live',
      'Dashboard Traveller: Daftarkan trip penerbangan, terima order, unggah foto nota belanja',
      'Live timeline tracking dengan update real-time via WebSocket/SSE'
    ],
    communication: 'REST API (DRF) untuk transactional CRUD; WebSocket / REST (Golang) untuk live tracking log.'
  }
];

export const DJANGO_MODELS: DatabaseModel[] = [
  {
    name: 'User & UserProfile',
    tableName: 'users_user & users_userprofile',
    description: 'Menyimpan data otentikasi identitas dan profil dua peran: Penitip (Shopper) dan Traveller (Carrier), beserta reputasi rating dan saldo dompet.',
    relations: ['1-to-1 dengan Custom User', '1-to-Many ke TripListing', '1-to-Many ke TitipRequest', '1-to-Many ke Order'],
    fields: [
      { name: 'id', type: 'UUID', constraints: 'Primary Key, default=uuid4', description: 'ID unik pengguna' },
      { name: 'email', type: 'EmailField', constraints: 'Unique, Indexed', description: 'Email untuk login' },
      { name: 'role', type: 'CharField(20)', constraints: 'Choices: penitip, traveller, both', description: 'Peran pengguna dalam ekosistem' },
      { name: 'full_name', type: 'CharField(150)', constraints: 'Required', description: 'Nama lengkap sesuai KTP' },
      { name: 'phone_number', type: 'CharField(20)', constraints: 'Unique, Indexed', description: 'Nomor WhatsApp aktif' },
      { name: 'is_verified_ktp', type: 'BooleanField', constraints: 'default=False', description: 'Status verifikasi identitas resmi' },
      { name: 'rating', type: 'DecimalField(3,2)', constraints: 'default=5.00', description: 'Reputasi akumulasi review (1.00 - 5.00)' },
      { name: 'total_reviews', type: 'IntegerField', constraints: 'default=0', description: 'Jumlah review terselesaikan' },
      { name: 'wallet_balance', type: 'DecimalField(14,2)', constraints: 'default=0', description: 'Saldo penarikan/escrow penitip (IDR)' }
    ],
    djangoCode: `from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    class RoleChoices(models.TextChoices):
        PENITIP = 'penitip', 'Penitip (Shopper)'
        TRAVELLER = 'traveller', 'Traveller (Carrier)'
        BOTH = 'both', 'Penitip & Traveller'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.PENITIP)
    phone_number = models.CharField(max_length=20, unique=True, db_index=True)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=150)
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)
    is_verified_ktp = models.BooleanField(default=False)
    ktp_document_url = models.URLField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    total_reviews = models.PositiveIntegerField(default=0)
    wallet_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)`
  },
  {
    name: 'Trip (Rute Traveller)',
    tableName: 'trips_trip',
    description: 'Jadwal perjalanan yang dipublikasikan oleh traveller, mencakup asal, tujuan, kuota bagasi (kg), dan tarif ongkos titip per kg.',
    relations: ['Many-to-1 ke User (Traveller)', '1-to-Many ke Order'],
    fields: [
      { name: 'id', type: 'UUID', constraints: 'Primary Key, default=uuid4', description: 'ID unik rute perjalanan' },
      { name: 'traveller', type: 'ForeignKey(User)', constraints: 'on_delete=CASCADE, related_name=trips', description: 'Pemilik perjalanan' },
      { name: 'origin_country', type: 'CharField(100)', constraints: 'Indexed', description: 'Negara asal (contoh: Jepang)' },
      { name: 'origin_city', type: 'CharField(100)', constraints: 'Indexed', description: 'Kota asal (contoh: Tokyo)' },
      { name: 'destination_country', type: 'CharField(100)', constraints: 'Default: Indonesia', description: 'Negara tujuan' },
      { name: 'destination_city', type: 'CharField(100)', constraints: 'Indexed', description: 'Kota tujuan (contoh: Jakarta)' },
      { name: 'departure_date', type: 'DateField', constraints: 'Indexed', description: 'Tanggal berangkat ke negara asal' },
      { name: 'arrival_date', type: 'DateField', constraints: 'Indexed', description: 'Tanggal tiba di Indonesia' },
      { name: 'total_baggage_kg', type: 'DecimalField(5,2)', constraints: 'Check > 0', description: 'Kapasitas bagasi total disiapkan' },
      { name: 'available_baggage_kg', type: 'DecimalField(5,2)', constraints: 'Check >= 0', description: 'Sisa kapasitas bagasi tersisa' },
      { name: 'fee_per_kg', type: 'DecimalField(12,2)', constraints: 'Check >= 0', description: 'Tarif jasa dasar per kg (IDR)' },
      { name: 'is_active', type: 'BooleanField', constraints: 'default=True', description: 'Status aktif menerima pesanan' }
    ],
    djangoCode: `class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    traveller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    origin_country = models.CharField(max_length=100, db_index=True)
    origin_city = models.CharField(max_length=100, db_index=True)
    destination_country = models.CharField(max_length=100, default='Indonesia')
    destination_city = models.CharField(max_length=100, db_index=True)
    departure_date = models.DateField(db_index=True)
    arrival_date = models.DateField(db_index=True)
    total_baggage_kg = models.DecimalField(max_digits=5, decimal_places=2)
    available_baggage_kg = models.DecimalField(max_digits=5, decimal_places=2)
    fee_per_kg = models.DecimalField(max_digits=12, decimal_places=2)
    accepted_categories = models.JSONField(default=list, help_text="['Skincare', 'Snack', 'Elektronik']")
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)`
  },
  {
    name: 'RequestTitipan (Permintaan Barang)',
    tableName: 'requests_requesttitipan',
    description: 'Postingan titip beli dari Shopper/Penitip, memuat detail barang, estimasi harga barang, tawaran fee, foto referensi, dan deadline.',
    relations: ['Many-to-1 ke User (Penitip)', '1-to-Many ke Order'],
    fields: [
      { name: 'id', type: 'UUID', constraints: 'Primary Key, default=uuid4', description: 'ID unik permintaan titip' },
      { name: 'shopper', type: 'ForeignKey(User)', constraints: 'on_delete=CASCADE', description: 'Pemesan barang' },
      { name: 'item_name', type: 'CharField(255)', constraints: 'db_index=True', description: 'Nama produk/barang' },
      { name: 'category', type: 'CharField(100)', constraints: 'Indexed', description: 'Kategori (Snack, Skincare, Shoes, dll)' },
      { name: 'origin_country', type: 'CharField(100)', constraints: 'Indexed', description: 'Negara tempat barang dijual' },
      { name: 'destination_city', type: 'CharField(100)', constraints: 'Indexed', description: 'Kota pengiriman tujuan penitip' },
      { name: 'estimated_price_idr', type: 'DecimalField(14,2)', constraints: 'Check > 0', description: 'Estimasi harga beli produk' },
      { name: 'offered_tip_fee_idr', type: 'DecimalField(12,2)', constraints: 'Check >= 0', description: 'Fee jasa titip yang ditawarkan' },
      { name: 'weight_est_kg', type: 'DecimalField(5,2)', constraints: 'Default: 0.5', description: 'Estimasi berat per unit' },
      { name: 'deadline_date', type: 'DateField', constraints: 'Indexed', description: 'Batas akhir barang harus tiba' },
      { name: 'status', type: 'CharField(20)', constraints: 'Choices: OPEN, MATCHED, IN_PROGRESS, COMPLETED', description: 'Status listing titipan' },
      { name: 'image_url', type: 'URLField', constraints: 'Required', description: 'Foto referensi produk' }
    ],
    djangoCode: `class RequestTitipan(models.Model):
    class StatusChoices(models.TextChoices):
        OPEN = 'OPEN', 'Mencari Jastiper'
        MATCHED = 'MATCHED', 'Telah Ditawar Jastiper'
        IN_PROGRESS = 'IN_PROGRESS', 'Sedang Diproses'
        COMPLETED = 'COMPLETED', 'Selesai'
        CANCELLED = 'CANCELLED', 'Dibatalkan'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shopper = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    item_name = models.CharField(max_length=255, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    product_url = models.URLField(blank=True, null=True)
    image_url = models.URLField()
    origin_country = models.CharField(max_length=100, db_index=True)
    origin_city = models.CharField(max_length=100, blank=True)
    destination_city = models.CharField(max_length=100, db_index=True)
    estimated_price_idr = models.DecimalField(max_digits=14, decimal_places=2)
    offered_tip_fee_idr = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    weight_est_kg = models.DecimalField(max_digits=5, decimal_places=2, default=0.5)
    deadline_date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.OPEN)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)`
  },
  {
    name: 'Order (Transaksi Kesepakatan Titipan)',
    tableName: 'orders_order',
    description: 'Kontrak transaksi antara Penitip dan Traveller setelah ada kesepakatan harga, rute, dan kuota.',
    relations: ['Many-to-1 ke RequestTitipan', 'Many-to-1 ke Trip (optional)', 'Many-to-1 ke Shopper (User)', 'Many-to-1 ke Traveller (User)', '1-to-1 ke PaymentEscrow'],
    fields: [
      { name: 'id', type: 'UUID', constraints: 'Primary Key, default=uuid4', description: 'ID unik pesanan' },
      { name: 'order_number', type: 'CharField(32)', constraints: 'Unique, Indexed', description: 'Kode invoice unik (e.g. JST-202610-001)' },
      { name: 'request', type: 'ForeignKey(RequestTitipan)', constraints: 'on_delete=PROTECT', description: 'Permintaan titip yang diproses' },
      { name: 'trip', type: 'ForeignKey(Trip, null=True)', constraints: 'on_delete=SET_NULL', description: 'Trip terkait penerbangan' },
      { name: 'shopper', type: 'ForeignKey(User)', constraints: 'on_delete=PROTECT', description: 'Penitip yang membayar' },
      { name: 'traveller', type: 'ForeignKey(User)', constraints: 'on_delete=PROTECT', description: 'Traveller yang membelikan' },
      { name: 'agreed_item_price', type: 'DecimalField(14,2)', constraints: 'Check > 0', description: 'Harga barang yang disepakati' },
      { name: 'agreed_jastip_fee', type: 'DecimalField(12,2)', constraints: 'Check >= 0', description: 'Ongkos jasa titip disepakati' },
      { name: 'platform_fee', type: 'DecimalField(10,2)', constraints: 'Default: 5%', description: 'Biaya layanan aplikasi' },
      { name: 'total_amount', type: 'DecimalField(14,2)', constraints: 'Generated = item + fee + platform', description: 'Total dana yang harus dititipkan di Escrow' },
      { name: 'status', type: 'CharField(30)', constraints: 'Choices State Machine', description: 'Status tahapan pesanan' }
    ],
    djangoCode: `class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_CONFIRMATION = 'PENDING_CONFIRMATION', 'Menunggu Konfirmasi'
        ESCROW_PAID = 'ESCROW_PAID', 'Dana Escrow Terkunci'
        ITEM_PURCHASED = 'ITEM_PURCHASED', 'Barang Telah Dibeli (Struk Uploaded)'
        IN_TRANSIT = 'IN_TRANSIT', 'Dalam Perjalanan Internasional'
        ARRIVED_LOCAL = 'ARRIVED_LOCAL', 'Tiba di Indonesia / Siap Kirim'
        DELIVERED = 'DELIVERED', 'Telah Diterima Penitip'
        COMPLETED = 'COMPLETED', 'Selesai & Dana Dicairkan'
        DISPUTED = 'DISPUTED', 'Dalam Sengketa'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=32, unique=True, db_index=True)
    request = models.ForeignKey(RequestTitipan, on_delete=models.PROTECT, related_name='orders')
    trip = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    shopper = models.ForeignKey(User, on_delete=models.PROTECT, related_name='shopper_orders')
    traveller = models.ForeignKey(User, on_delete=models.PROTECT, related_name='traveller_orders')
    agreed_item_price = models.DecimalField(max_digits=14, decimal_places=2)
    agreed_jastip_fee = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_CONFIRMATION)
    receipt_photo_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)`
  },
  {
    name: 'PaymentEscrow (Rekening Bersama)',
    tableName: 'payments_paymentescrow',
    description: 'Menjaga keamanan transaksi finansial. Dana disimpan aman di rekening bersama sistem dan hanya dicairkan ke Traveller setelah barang diverifikasi Penitip.',
    relations: ['1-to-1 ke Order'],
    fields: [
      { name: 'id', type: 'UUID', constraints: 'Primary Key, default=uuid4', description: 'ID unik escrow' },
      { name: 'order', type: 'OneToOneField(Order)', constraints: 'on_delete=PROTECT, related_name=escrow', description: 'Order yang dijamin' },
      { name: 'amount_held', type: 'DecimalField(14,2)', constraints: 'Check > 0', description: 'Nominal dana yang ditahan di rekber' },
      { name: 'status', type: 'CharField(25)', constraints: 'Choices: HELD, RELEASED_TO_TRAVELLER, REFUNDED_TO_PENITIP', description: 'Status dana' },
      { name: 'pg_reference_id', type: 'CharField(100)', constraints: 'Indexed', description: 'ID transaksi Payment Gateway (Midtrans/Xendit)' },
      { name: 'locked_at', type: 'DateTimeField', constraints: 'Null=True', description: 'Waktu pembayaran escrow terverifikasi' },
      { name: 'released_at', type: 'DateTimeField', constraints: 'Null=True', description: 'Waktu pelepasan dana ke dompet traveller' }
    ],
    djangoCode: `class PaymentEscrow(models.Model):
    class EscrowStatus(models.TextChoices):
        PENDING_PAYMENT = 'PENDING_PAYMENT', 'Menunggu Pembayaran'
        HELD = 'HELD', 'Dana Aman di Escrow'
        RELEASED_TO_TRAVELLER = 'RELEASED_TO_TRAVELLER', 'Dana Dicairkan ke Traveller'
        REFUNDED_TO_PENITIP = 'REFUNDED_TO_PENITIP', 'Dana Dikembalikan ke Penitip'
        DISPUTED = 'DISPUTED', 'Ditahan Karena Dispute'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name='escrow')
    amount_held = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=25, choices=EscrowStatus.choices, default=EscrowStatus.PENDING_PAYMENT)
    pg_reference_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)`
  },
  {
    name: 'TrackingEvent (Log Pelacakan Cepat - Managed by Go)',
    tableName: 'tracking_trackingevent',
    description: 'Catatan perjalanan status barang real-time (dibeli, upload nota, boarding, mendarat, resi pengiriman lokal), ditulis dan di-broadcast dengan performa tinggi oleh microservice Go.',
    relations: ['Many-to-1 ke Order'],
    fields: [
      { name: 'id', type: 'UUID', constraints: 'Primary Key, default=uuid4', description: 'ID log pelacakan' },
      { name: 'order_id', type: 'UUID', constraints: 'Indexed, Foreign Key ke Order', description: 'ID pesanan yang dilacak' },
      { name: 'status', type: 'CharField(30)', constraints: 'Indexed', description: 'Milestone status' },
      { name: 'title', type: 'CharField(255)', constraints: 'Required', description: 'Judul ringkas milestone' },
      { name: 'description', type: 'TextField', constraints: 'Optional', description: 'Detail catatan atau nomor resi lokal' },
      { name: 'location', type: 'CharField(150)', constraints: 'Indexed', description: 'Lokasi (misal: Ginza Tokyo / Bandara CGK)' },
      { name: 'receipt_photo_url', type: 'URLField', constraints: 'Null=True', description: 'URL foto struk pembelian' },
      { name: 'created_at', type: 'DateTimeField', constraints: 'Auto add now, Indexed desc', description: 'Timestamp log' }
    ],
    djangoCode: `class TrackingEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tracking_events')
    status = models.CharField(max_length=30, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=150)
    receipt_photo_url = models.URLField(blank=True, null=True)
    actor_role = models.CharField(max_length=20, default='traveller')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)`
  }
];

export const PROJECT_FOLDER_STRUCTURE = {
  django: `backend-django/
├── manage.py
├── requirements.txt
├── Dockerfile
├── jastip_core/                 # Konfigurasi Utama Proyek
│   ├── __init__.py
│   ├── settings.py              # PostgreSQL, Redis Pub/Sub, SimpleJWT config
│   ├── urls.py                  # Routing master /api/v1/
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── authentication/          # Service Akun & JWT
│   │   ├── models.py            # User, UserProfile, KYC
│   │   ├── serializers.py       # Register, Login, TokenRefresh, ProfileSerializer
│   │   ├── views.py             # AuthViewSet, KYCUploadView
│   │   ├── permissions.py       # IsVerifiedTraveller, IsShopper
│   │   └── urls.py
│   ├── trips/                   # Service Rute Perjalanan Traveller
│   │   ├── models.py            # Trip (asal, tujuan, bagasi kg, fee/kg)
│   │   ├── serializers.py       # TripSerializer, TripListQuerySerializer
│   │   ├── views.py             # TripViewSet
│   │   └── urls.py
│   ├── requests/                # Service Permintaan Titip Barang
│   │   ├── models.py            # RequestTitipan
│   │   ├── serializers.py       # RequestTitipanSerializer, MatchQuerySerializer
│   │   ├── services.py          # MatchingEngine (Algoritma pencocokan Trip & Request)
│   │   ├── views.py             # RequestTitipanViewSet, MatchTripAPIView
│   │   └── urls.py
│   ├── orders/                  # Service Transaksi & Order State Machine
│   │   ├── models.py            # Order
│   │   ├── serializers.py       # OrderCreateSerializer, OrderDetailSerializer
│   │   ├── state_machine.py     # Transisi status pesanan
│   │   ├── views.py             # OrderViewSet
│   │   └── urls.py
│   └── escrow/                  # Rekening Bersama & Payment Lock
│       ├── models.py            # PaymentEscrow
│       ├── serializers.py       # EscrowSerializer
│       ├── services.py          # EscrowLockService (Postgres SELECT FOR UPDATE)
│       ├── views.py             # EscrowPaymentWebhookView, ReleaseEscrowView
│       └── urls.py
└── utils/
    ├── event_bus.py             # Redis Pub/Sub Publisher (order.status_changed)
    └── response_formatter.py   # Standard JSON envelope {status, message, data}`,

  golang: `microservice-golang/
├── go.mod
├── go.sum
├── Dockerfile
├── config/
│   └── config.go                # Load env (PORT, REDIS_URL, DB_URL, JWT_SECRET)
├── internal/
│   ├── domain/                  # Entitas domain & model database
│   │   ├── tracking.go          # Struct TrackingEvent & OrderStatus
│   │   └── notification.go      # Struct PushNotificationPayload
│   ├── repository/              # Interaksi Database PostgreSQL (pgx/gorm)
│   │   ├── postgres.go          # Connection pool
│   │   └── tracking_repo.go     # InsertTrackingEvent, GetTrackingByOrderID
│   ├── service/                 # Logika bisnis performa tinggi
│   │   ├── tracking_service.go  # Validasi milestone, insert DB, publish SSE/WS
│   │   └── event_subscriber.go  # Redis Pub/Sub listener dari Django core
│   ├── delivery/
│   │   ├── http/                # REST API via Gin Framework
│   │   │   ├── router.go        # Register endpoints /api/v1/tracking
│   │   │   ├── middleware.go    # Fast JWT verification & Rate Limiter
│   │   │   └── tracking_handler.go # PostTrackingEvent, GetOrderTimeline, UploadReceipt
│   │   └── websocket/           # Real-time WebSocket Hub
│   │       ├── hub.go           # Client connection manager per OrderID
│   │       └── ws_handler.go    # Upgrader & client read/write pump
│   └── pkg/
│       ├── redisclient/         # Redis connection & PubSub wrapper
│       └── storage/             # S3 presigned URL generator untuk receipt
└── cmd/
    └── server/
        └── main.go              # Entry point microservice Gin + Goroutines`
};
