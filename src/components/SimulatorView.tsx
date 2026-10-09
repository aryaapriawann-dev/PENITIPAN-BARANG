import React, { useState } from 'react';
import { 
  PlayCircle, 
  ShoppingBag, 
  Plane, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Upload, 
  Send, 
  Receipt, 
  Package, 
  Camera, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Zap,
  MapPin
} from 'lucide-react';
import { TitipRequest, TripListing, JastipOrder, TrackingEvent, UserRole } from '../types/jastip';

interface SimulatorViewProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  currentRole,
  setCurrentRole
}) => {
  // Mock Initial Data
  const [requests, setRequests] = useState<TitipRequest[]>([
    {
      id: 'req-101',
      shopperId: 'usr-penitip-1',
      shopperName: 'Siti Rahmawati',
      shopperAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
      itemName: 'Tokyo Banana Pie Special Edition (12 pcs)',
      category: 'Snack & Makanan',
      imageUrl: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=400',
      originCountry: 'Jepang',
      originCity: 'Tokyo',
      destinationCity: 'Jakarta',
      estimatedPriceIdr: 320000,
      offeredTipFeeIdr: 95000,
      quantity: 1,
      weightEstKg: 0.8,
      deadlineDate: '2026-10-25',
      status: 'OPEN',
      notes: 'Beli di Tokyo Station, pastikan expired date masih panjang minimal 2 minggu.',
      createdAt: '2026-10-09'
    },
    {
      id: 'req-102',
      shopperId: 'usr-penitip-2',
      shopperName: 'Budi Santoso',
      shopperAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      itemName: 'SK-II Facial Treatment Essence 230ml',
      category: 'Skincare',
      imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
      originCountry: 'Jepang',
      originCity: 'Tokyo',
      destinationCity: 'Jakarta',
      estimatedPriceIdr: 2450000,
      offeredTipFeeIdr: 350000,
      quantity: 1,
      weightEstKg: 0.6,
      deadlineDate: '2026-10-28',
      status: 'OPEN',
      notes: 'Wajib ada segel box dan struk asli counter resmi.',
      createdAt: '2026-10-09'
    }
  ]);

  const [trips, setTrips] = useState<TripListing[]>([
    {
      id: 'trip-201',
      travellerId: 'usr-traveller-1',
      travellerName: 'Kenji Pratama',
      travellerRating: 4.98,
      travellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      originCountry: 'Jepang',
      originCity: 'Tokyo',
      destinationCountry: 'Indonesia',
      destinationCity: 'Jakarta',
      departureDate: '2026-10-14',
      arrivalDate: '2026-10-20',
      availableBaggageKg: 8.5,
      feePerKg: 150000,
      acceptedCategories: ['Snack & Makanan', 'Skincare', 'Fashion'],
      notes: 'Terbang dengan Japan Airlines JL725. Siap bantu belikan di Ginza / Akihabara / Duty Free.',
      isActive: true,
      createdAt: '2026-10-08'
    }
  ]);

  // Current Active Order in Simulation
  const [activeOrder, setActiveOrder] = useState<JastipOrder | null>(null);
  const [selectedReqForMatch, setSelectedReqForMatch] = useState<TitipRequest | null>(null);
  const [matchedTripsList, setMatchedTripsList] = useState<any[]>([]);

  // Simulation form inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(250000);
  const [newItemFee, setNewItemFee] = useState(80000);
  const [newOriginCountry, setNewOriginCountry] = useState('Jepang');
  const [newDestinationCity, setNewDestinationCity] = useState('Jakarta');

  // Trigger DRF Matching Engine
  const handleRunMatching = (req: TitipRequest) => {
    setSelectedReqForMatch(req);
    // Simulate Django Matching Engine logic
    const matches = trips.filter(
      (t) =>
        t.originCountry.toLowerCase() === req.originCountry.toLowerCase() &&
        t.availableBaggageKg >= req.weightEstKg &&
        t.arrivalDate <= req.deadlineDate
    ).map((t) => {
      let score = 75;
      const reasons = [];
      if (t.originCity.toLowerCase() === req.originCity.toLowerCase()) {
        score += 15;
        reasons.push(`Kota asal sama (${t.originCity})`);
      }
      if (t.acceptedCategories.includes(req.category)) {
        score += 5;
        reasons.push(`Menerima kategori ${req.category}`);
      }
      reasons.push(`Tiba ${t.arrivalDate} sebelum batas deadline ${req.deadlineDate}`);
      reasons.push(`Sisa bagasi ${t.availableBaggageKg}kg cukup untuk barang ${req.weightEstKg}kg`);

      return {
        trip: t,
        score: Math.min(score, 100),
        reasons
      };
    });

    setMatchedTripsList(matches);
  };

  // Lock Escrow & Create Order
  const handleCreateOrderWithEscrow = (req: TitipRequest, trip: TripListing) => {
    const itemPrice = req.estimatedPriceIdr;
    const jastipFee = req.offeredTipFeeIdr;
    const platformFee = Math.round((itemPrice + jastipFee) * 0.05); // 5%
    const totalAmount = itemPrice + jastipFee + platformFee;

    const initialTrackingEvent: TrackingEvent = {
      id: `trk-${Date.now()}`,
      orderId: 'ord-sim-01',
      status: 'ESCROW_PAID',
      title: 'Dana Rekening Bersama (Escrow) Diverifikasi',
      description: `Dana senilai Rp ${totalAmount.toLocaleString('id-ID')} terkunci aman di Rekber Titip. Notifikasi terkirim ke Traveller.`,
      location: 'Sistem Escrow Gateway',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      actorRole: 'system'
    };

    const newOrder: JastipOrder = {
      id: 'ord-sim-01',
      orderNumber: `JST-202610-${Math.floor(1000 + Math.random() * 9000)}`,
      requestId: req.id,
      tripId: trip.id,
      shopperId: req.shopperId,
      shopperName: req.shopperName,
      travellerId: trip.travellerId,
      travellerName: trip.travellerName,
      itemName: req.itemName,
      itemPriceIdr: itemPrice,
      jastipFeeIdr: jastipFee,
      platformFeeIdr: platformFee,
      totalEscrowAmountIdr: totalAmount,
      status: 'ESCROW_PAID',
      escrowStatus: 'HELD',
      createdAt: new Date().toISOString(),
      trackingEvents: [initialTrackingEvent]
    };

    setActiveOrder(newOrder);
    setSelectedReqForMatch(null);
  };

  // Traveller Step 1: Purchase Item & Upload Receipt (Golang Event Ingestion)
  const handleTravellerPurchase = () => {
    if (!activeOrder) return;

    const event: TrackingEvent = {
      id: `trk-${Date.now()}`,
      orderId: activeOrder.id,
      status: 'ITEM_PURCHASED',
      title: 'Barang Telah Dibeli di Counter Resmi Tokyo',
      description: 'Nota belanja terverifikasi dan barang tersimpan aman dalam bubble wrap.',
      location: 'Ginza Mitsukoshi, Tokyo',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3507?w=500',
      actorRole: 'traveller'
    };

    setActiveOrder({
      ...activeOrder,
      status: 'ITEM_PURCHASED',
      trackingEvents: [event, ...activeOrder.trackingEvents]
    });
  };

  // Traveller Step 2: Flight Boarding & In Transit (Golang Stream)
  const handleFlightBoarding = () => {
    if (!activeOrder) return;

    const event: TrackingEvent = {
      id: `trk-${Date.now()}`,
      orderId: activeOrder.id,
      status: 'IN_TRANSIT',
      title: 'Penerbangan JL725 Menuju Jakarta (CGK)',
      description: 'Barang berada di bagasi kabin Traveller dalam perjalanan ke Indonesia.',
      location: 'Narita International Airport (NRT)',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      actorRole: 'traveller'
    };

    setActiveOrder({
      ...activeOrder,
      status: 'IN_TRANSIT',
      trackingEvents: [event, ...activeOrder.trackingEvents]
    });
  };

  // Traveller Step 3: Arrived & Shipped via Courier
  const handleArrivedAndShipped = () => {
    if (!activeOrder) return;

    const event: TrackingEvent = {
      id: `trk-${Date.now()}`,
      orderId: activeOrder.id,
      status: 'ARRIVED_LOCAL',
      title: 'Tiba di Jakarta & Diserahkan ke Ekspedisi Lokal',
      description: 'No. Resi JNE: JNE-CGK-892019310 (Estimasi sampai hari ini).',
      location: 'Bandara Soekarno-Hatta Terminal 3',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      actorRole: 'traveller'
    };

    setActiveOrder({
      ...activeOrder,
      status: 'ARRIVED_LOCAL',
      trackingEvents: [event, ...activeOrder.trackingEvents]
    });
  };

  // Shopper Step 4: Confirm Delivered & Release Escrow
  const handleReleaseEscrow = () => {
    if (!activeOrder) return;

    const event: TrackingEvent = {
      id: `trk-${Date.now()}`,
      orderId: activeOrder.id,
      status: 'COMPLETED',
      title: 'Barang Diterima & Escrow Dicairkan ke Traveller',
      description: `Penitip mengonfirmasi kesesuaian barang. Saldo Rp ${(activeOrder.itemPriceIdr + activeOrder.jastipFeeIdr).toLocaleString('id-ID')} masuk ke dompet penarikan Traveller.`,
      location: 'Kediaman Penitip (Jakarta)',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      actorRole: 'penitip'
    };

    setActiveOrder({
      ...activeOrder,
      status: 'COMPLETED',
      escrowStatus: 'RELEASED_TO_TRAVELLER',
      trackingEvents: [event, ...activeOrder.trackingEvents]
    });
  };

  const handleResetSimulation = () => {
    setActiveOrder(null);
    setSelectedReqForMatch(null);
    setMatchedTripsList([]);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PlayCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Live Simulator Alur Transaksi Jastip & Escrow
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Jalankan skenario nyata: Buat Permintaan &rarr; Matching Rute Traveller &rarr; Kunci Escrow Rekber &rarr; Upload Nota &rarr; Tracking Cepat &rarr; Pencairan Dana.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-100 text-slate-700 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Simulasi</span>
        </button>
      </div>

      {/* Main Simulation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Requests & Trips */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card: Active Titip Requests */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-rose-500" />
                  <span>Daftar Permintaan Titipan (Shopper)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Dikelola oleh Django Core Service (Katalog & CRUD)
                </p>
              </div>
              <span className="text-xs font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                {requests.length} Terdaftar
              </span>
            </div>

            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={req.imageUrl}
                      alt={req.itemName}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {req.itemName}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{req.originCountry} ({req.originCity}) &rarr; {req.destinationCity}</span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700">
                        Harga: Rp {req.estimatedPriceIdr.toLocaleString('id-ID')} · Fee: Rp {req.offeredTipFeeIdr.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunMatching(req)}
                    className="shrink-0 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 self-end sm:self-auto shadow-xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Cari Traveller</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Matching Engine Popup / Card */}
          {selectedReqForMatch && (
            <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-300 tracking-wider">
                    Django Matching Engine
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Hasil Pencocokan untuk: {selectedReqForMatch.itemName}
                  </h4>
                </div>
                <span className="text-xs bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded">
                  {matchedTripsList.length} Rute Cocok
                </span>
              </div>

              {matchedTripsList.map(({ trip, score, reasons }, idx) => (
                <div key={idx} className="bg-indigo-950/70 p-4 rounded-lg border border-indigo-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={trip.travellerAvatar}
                        alt={trip.travellerName}
                        className="w-8 h-8 rounded-full border border-indigo-400"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{trip.travellerName}</div>
                        <div className="text-[11px] text-indigo-300">Rating ★ {trip.travellerRating} · Sisa Bagasi {trip.availableBaggageKg}kg</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                        {score}% Cocok
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-indigo-200 space-y-1">
                    {reasons.map((r: string, rIdx: number) => (
                      <div key={rIdx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCreateOrderWithEscrow(selectedReqForMatch, trip)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Sepakati & Kunci Dana di Escrow (Rekber)</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Card: Registered Trips (Traveller) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-sky-500" />
                  <span>Daftar Rute Perjalanan Traveller (Trips)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Jadwal penerbangan dan slot bagasi aktif
                </p>
              </div>
              <span className="text-xs font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded">
                {trips.length} Penerbangan
              </span>
            </div>

            <div className="space-y-3">
              {trips.map((t) => (
                <div key={t.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={t.travellerAvatar} alt={t.travellerName} className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-xs font-bold text-slate-900">{t.travellerName}</span>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Sisa Bagasi: {t.availableBaggageKg} kg
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 flex items-center gap-2 font-mono">
                    <span>{t.originCity} ({t.originCountry})</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>{t.destinationCity}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tiba: {t.arrivalDate} · Tarif dasar: Rp {t.feePerKg.toLocaleString('id-ID')}/kg
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Lifecycle, Escrow Status, & Real-time Tracking Events */}
        <div className="lg:col-span-6 space-y-6">
          {activeOrder ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
              {/* Order Header */}
              <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Invoice: {activeOrder.orderNumber}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {activeOrder.itemName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Shopper: {activeOrder.shopperName} &bull; Traveller: {activeOrder.travellerName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block font-mono">
                    Rp {activeOrder.totalEscrowAmountIdr.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    activeOrder.escrowStatus === 'RELEASED_TO_TRAVELLER'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activeOrder.escrowStatus === 'RELEASED_TO_TRAVELLER'
                      ? 'ESCROW DICAIRKAN'
                      : 'DANA AMAN DI ESCROW'}
                  </span>
                </div>
              </div>

              {/* Action Buttons to Trigger Real-Time Milestones */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Simulasikan Tindakan Tahapan Transaksi:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Traveller Button 1 */}
                  <button
                    type="button"
                    onClick={handleTravellerPurchase}
                    disabled={activeOrder.status !== 'ESCROW_PAID'}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-left text-xs hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      <span>1. Beli & Upload Struk</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Traveller kirim bukti ke Golang Service
                    </div>
                  </button>

                  {/* Traveller Button 2 */}
                  <button
                    type="button"
                    onClick={handleFlightBoarding}
                    disabled={activeOrder.status !== 'ITEM_PURCHASED'}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-left text-xs hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                      <Plane className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Penerbangan Pulang</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Stream status terbang via WebSocket
                    </div>
                  </button>

                  {/* Traveller Button 3 */}
                  <button
                    type="button"
                    onClick={handleArrivedAndShipped}
                    disabled={activeOrder.status !== 'IN_TRANSIT'}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-left text-xs hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      <span>3. Tiba & Kirim Ekspedisi</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Input no. resi JNE & simulasi webhook
                    </div>
                  </button>

                  {/* Shopper Button 4: Release Escrow */}
                  <button
                    type="button"
                    onClick={handleReleaseEscrow}
                    disabled={activeOrder.status !== 'ARRIVED_LOCAL'}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-left text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    <div className="font-bold flex items-center gap-1.5 mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                      <span>4. Konfirmasi & Cairkan Escrow</span>
                    </div>
                    <div className="text-[10px] text-emerald-100">
                      Shopper setujui & transfer saldo
                    </div>
                  </button>
                </div>
              </div>

              {/* Real-time Tracking Timeline (Powered by Go Ingestion) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-500" />
                    <span>Real-Time Tracking Events Timeline (Golang Gin Stream)</span>
                  </h5>
                  <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live WebSocket
                  </span>
                </div>

                <div className="space-y-4 border-l-2 border-slate-200 pl-4 ml-2">
                  {activeOrder.trackingEvents.map((evt) => (
                    <div key={evt.id} className="relative space-y-1">
                      {/* Marker dot */}
                      <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {evt.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {evt.timestamp}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        {evt.description}
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        <span>{evt.location}</span>
                      </div>

                      {evt.receiptPhotoUrl && (
                        <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 inline-block">
                          <span className="text-[10px] font-medium text-slate-700 block mb-1">
                            Foto Bukti Struk Pembelian Resmi:
                          </span>
                          <img
                            src={evt.receiptPhotoUrl}
                            alt="Receipt"
                            className="w-32 h-20 object-cover rounded border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Belum Ada Order Aktif di Simulasi
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan pilih salah satu Permintaan Titipan di sebelah kiri dan klik tombol <strong>"Cari Traveller"</strong> untuk memulai siklus pesanan dan Escrow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
