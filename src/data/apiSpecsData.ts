import { ApiEndpoint } from '../types/jastip';

export const API_ENDPOINTS: ApiEndpoint[] = [
  // --- DJANGO REST FRAMEWORK ENDPOINTS ---
  {
    service: 'Django (Core)',
    method: 'POST',
    path: '/api/v1/auth/register/',
    summary: 'Registrasi Akun Penitip / Traveller',
    description: 'Mendaftarkan akun baru dengan verifikasi email, nomor telepon WhatsApp, dan pemilihan role dasar.',
    authRequired: false,
    requestBody: JSON.stringify(
      {
        email: 'user@example.com',
        password: 'SuperSecretPassword123!',
        full_name: 'Budi Santoso',
        phone_number: '+6281234567890',
        role: 'penitip'
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        status: 'success',
        message: 'Registrasi berhasil. Silakan verifikasi nomor OTP.',
        data: {
          user_id: 'a9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          email: 'user@example.com',
          role: 'penitip',
          token: {
            access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      },
      null,
      2
    ),
    statusCode: 201
  },
  {
    service: 'Django (Core)',
    method: 'POST',
    path: '/api/v1/auth/login/',
    summary: 'Login & Dapatkan JWT Token',
    description: 'Otentikasi dengan email/password, mengembalikan JWT Access Token (15 menit) dan Refresh Token (7 hari).',
    authRequired: false,
    requestBody: JSON.stringify(
      {
        email: 'user@example.com',
        password: 'SuperSecretPassword123!'
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        status: 'success',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'a9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            full_name: 'Budi Santoso',
            role: 'penitip',
            is_verified_ktp: true,
            rating: 4.95
          }
        }
      },
      null,
      2
    ),
    statusCode: 200
  },
  {
    service: 'Django (Core)',
    method: 'GET',
    path: '/api/v1/requests/',
    summary: 'List & Filter Permintaan Titip Barang',
    description: 'Mendapatkan daftar permintaan titipan aktif dengan filter negara asal, kota tujuan, kategori, dan estimasi budget.',
    authRequired: false,
    responseBody: JSON.stringify(
      {
        count: 42,
        next: '/api/v1/requests/?page=2',
        previous: null,
        results: [
          {
            id: '7f3e82a1-9b4c-4e81-b511-3829ad41029e',
            shopper: {
              id: 'u-101',
              full_name: 'Siti Rahma',
              rating: 5.0
            },
            item_name: 'Tokyo Banana Pie Special Edition (12 pcs)',
            category: 'Snack & Makanan',
            origin_country: 'Jepang',
            origin_city: 'Tokyo',
            destination_city: 'Jakarta',
            estimated_price_idr: 320000,
            offered_tip_fee_idr: 95000,
            weight_est_kg: 0.8,
            deadline_date: '2026-10-25',
            status: 'OPEN'
          }
        ]
      },
      null,
      2
    ),
    statusCode: 200
  },
  {
    service: 'Django (Core)',
    method: 'POST',
    path: '/api/v1/requests/',
    summary: 'Buat Permintaan Titip Barang Baru',
    description: 'Shopper memposting permintaan titip barang baru dengan spesifikasi produk, foto referensi, dan tawaran tip jasa.',
    authRequired: true,
    requiredRole: 'penitip',
    requestBody: JSON.stringify(
      {
        item_name: 'SK-II Facial Treatment Essence 230ml',
        category: 'Skincare',
        origin_country: 'Jepang',
        origin_city: 'Tokyo',
        destination_city: 'Jakarta',
        estimated_price_idr: 2450000,
        offered_tip_fee_idr: 350000,
        quantity: 1,
        weight_est_kg: 0.6,
        deadline_date: '2026-10-30',
        image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
        notes: 'Tolong beli di Haneda Airport Duty Free agar bebas tax, pastikan segel utuh.'
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        status: 'success',
        message: 'Permintaan titip barang berhasil dipublikasikan.',
        data: {
          id: 'req-89123-uuid',
          item_name: 'SK-II Facial Treatment Essence 230ml',
          status: 'OPEN',
          created_at: '2026-10-09T06:30:00Z'
        }
      },
      null,
      2
    ),
    statusCode: 201
  },
  {
    service: 'Django (Core)',
    method: 'GET',
    path: '/api/v1/requests/{request_id}/matching-trips/',
    summary: 'Pencocokan Otomatis Rute Traveller (Matching Engine)',
    description: 'Mencari penerbangan traveller yang cocok secara rute (Tokyo -> Jakarta), batas waktu kedatangan sebelum deadline, dan sisa kapasitas bagasi mencukupi.',
    authRequired: true,
    responseBody: JSON.stringify(
      {
        request_id: 'req-89123-uuid',
        total_matched_trips: 3,
        matches: [
          {
            trip_id: 'trip-jp-jkt-99',
            traveller_name: 'Kenji Pratama',
            traveller_rating: 4.98,
            is_verified: true,
            flight_route: 'Tokyo (NRT) -> Jakarta (CGK)',
            arrival_date: '2026-10-21',
            available_baggage_kg: 7.5,
            fee_per_kg: 150000,
            match_score: 98,
            compatibility_reasons: [
              'Tiba 9 hari sebelum deadline',
              'Sisa bagasi 7.5 kg sangat cukup untuk barang 0.6 kg',
              'Traveller memiliki reputasi 50+ transaksi sukses'
            ]
          }
        ]
      },
      null,
      2
    ),
    statusCode: 200
  },
  {
    service: 'Django (Core)',
    method: 'POST',
    path: '/api/v1/orders/create-with-escrow/',
    summary: 'Buat Order & Kunci Dana di Escrow (Rekber)',
    description: 'Mengikat kesepakatan antara Shopper dan Traveller, membuat invoice Escrow, dan mengunci nominal transaksi secara atomik (SELECT FOR UPDATE).',
    authRequired: true,
    requiredRole: 'penitip',
    requestBody: JSON.stringify(
      {
        request_id: 'req-89123-uuid',
        trip_id: 'trip-jp-jkt-99',
        agreed_item_price: 2450000,
        agreed_jastip_fee: 350000,
        payment_method: 'VIRTUAL_ACCOUNT_BCA'
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        status: 'success',
        order_number: 'JST-202610-8849',
        order_id: 'ord-uuid-9901',
        total_escrow_held: 2940000,
        breakdown: {
          item_price: 2450000,
          jastip_fee: 350000,
          platform_fee: 140000
        },
        escrow_status: 'HELD',
        payment_gateway_ref: 'TRX-VA-BCA-9839120',
        message: 'Dana aman di Rekber Titip. Traveller akan diberitahu untuk memulai pembelian.'
      },
      null,
      2
    ),
    statusCode: 201
  },
  {
    service: 'Django (Core)',
    method: 'POST',
    path: '/api/v1/orders/{order_id}/release-escrow/',
    summary: 'Verifikasi Penerimaan & Cairkan Dana ke Traveller',
    description: 'Dipanggil saat penitip telah menerima barang dan mengonfirmasi kesesuaian, melepaskan dana escrow ke saldo penarikan traveller.',
    authRequired: true,
    requiredRole: 'penitip',
    requestBody: JSON.stringify(
      {
        rating: 5,
        review_text: 'Barang original, kondisi mulus, traveller sangat komunikatif dan tepat waktu!'
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        status: 'success',
        message: 'Escrow senilai Rp 2.800.000 berhasil dicairkan ke saldo dompet traveller.',
        order_status: 'COMPLETED',
        escrow_status: 'RELEASED_TO_TRAVELLER'
      },
      null,
      2
    ),
    statusCode: 200
  },

  // --- GOLANG HIGH-PERFORMANCE SERVICE ENDPOINTS ---
  {
    service: 'Golang (Real-time Tracking)',
    method: 'POST',
    path: '/api/v1/tracking/events',
    summary: 'Kirim Event Pelacakan & Bukti Pembelian (High Throughput)',
    description: 'Handler berkecepatan tinggi di Gin untuk Traveller mencatat status barang (struk pembelian, boarding pesawat, tiba di bandara, nomor resi kurir lokal).',
    authRequired: true,
    requiredRole: 'traveller',
    requestBody: JSON.stringify(
      {
        order_id: 'ord-uuid-9901',
        status: 'ITEM_PURCHASED',
        title: 'Barang Berhasil Dibeli di Ginza Mitsukoshi',
        location: 'Ginza, Tokyo, Japan',
        description: 'Barang dibeli langsung dari counter resmi, struk dan garansi internasional terlampir.',
        receipt_photo_url: 'https://images.unsplash.com/photo-1554415707-9e49016a3507?w=600'
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        success: true,
        event_id: 'trk-event-go-10294',
        timestamp: '2026-10-09T06:32:15.104Z',
        broadcast_channels: ['ws:order:ord-uuid-9901', 'redis:events:tracking'],
        message: 'Tracking milestone recorded and pushed in 2.4ms'
      },
      null,
      2
    ),
    statusCode: 201
  },
  {
    service: 'Golang (Real-time Tracking)',
    method: 'GET',
    path: '/api/v1/tracking/{order_id}/timeline',
    summary: 'Ambil Timeline Pelacakan Lengkap (Cached via Redis)',
    description: 'Mengambil riwayat kronologis status barang dari PostgreSQL dengan in-memory Redis cache untuk respon sub-5 milidetik.',
    authRequired: true,
    responseBody: JSON.stringify(
      {
        order_id: 'ord-uuid-9901',
        current_status: 'IN_TRANSIT',
        last_updated: '2026-10-09T06:30:00Z',
        events: [
          {
            event_id: 'trk-01',
            status: 'ESCROW_PAID',
            title: 'Pembayaran Rekber Diverifikasi',
            location: 'System Escrow Gateway',
            timestamp: '2026-10-08T10:00:00Z'
          },
          {
            event_id: 'trk-02',
            status: 'ITEM_PURCHASED',
            title: 'Barang Dibeli di Tokyo',
            location: 'Ginza, Tokyo',
            receipt_url: 'https://images.unsplash.com/photo-1554415707-9e49016a3507?w=600',
            timestamp: '2026-10-08T16:30:00Z'
          },
          {
            event_id: 'trk-03',
            status: 'IN_TRANSIT',
            title: 'Penerbangan JL725 Menuju Jakarta (CGK)',
            location: 'Narita International Airport',
            timestamp: '2026-10-09T02:15:00Z'
          }
        ]
      },
      null,
      2
    ),
    statusCode: 200
  },
  {
    service: 'Golang (Real-time Tracking)',
    method: 'GET',
    path: '/ws/v1/orders/{order_id}/stream',
    summary: 'WebSocket Real-time Stream Pelacakan & Chat',
    description: 'Koneksi bi-directional duplex WebSocket berkinerja tinggi untuk streaming live status, notifikasi instan, dan pertukaran pesan.',
    authRequired: true,
    responseBody: JSON.stringify(
      {
        protocol: 'WebSocket (RFC 6455)',
        handshake_status: '101 Switching Protocols',
        heartbeat_interval_sec: 30,
        sample_frame: {
          type: 'STATUS_UPDATE',
          order_id: 'ord-uuid-9901',
          status: 'ARRIVED_LOCAL',
          message: 'Traveller telah tiba di Bandara Soekarno-Hatta Terminal 3.',
          timestamp: '2026-10-09T06:40:00Z'
        }
      },
      null,
      2
    ),
    statusCode: 101
  },
  {
    service: 'Golang (Real-time Tracking)',
    method: 'POST',
    path: '/api/v1/webhooks/courier',
    summary: 'Webhook Ingestion Ekspedisi Lokal (JNE / SiCepat / J&T)',
    description: 'Endpoint penerima status webhook dari ekspedisi lokal dengan verifikasi tanda tangan HMAC-SHA256 untuk memvalidasi paket terkirim.',
    authRequired: false,
    requestBody: JSON.stringify(
      {
        airway_bill: 'JNE-CGK-891028301',
        status: 'DELIVERED',
        receiver_name: 'Budi Santoso (Yang Bersangkutan)',
        timestamp: '2026-10-09T09:12:00Z',
        signature_hmac: '7b8f9e01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9...'
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        received: true,
        processed_in_ms: 1.8,
        order_updated: 'ord-uuid-9901',
        status: 'DELIVERED'
      },
      null,
      2
    ),
    statusCode: 200
  }
];
