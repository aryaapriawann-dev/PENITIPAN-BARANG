export interface CodeFile {
  id: string;
  filename: string;
  language: string;
  title: string;
  description: string;
  code: string;
}

export const CODE_SNIPPETS: CodeFile[] = [
  {
    id: 'django-serializers',
    filename: 'backend-django/apps/requests/serializers.py',
    language: 'python',
    title: 'Django REST Framework: Request & Matching Serializer',
    description: 'Serializer untuk validasi ketat request titipan barang, estimasi berat, tanggal deadline, dan nested detail traveller.',
    code: `from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import RequestTitipan
from apps.trips.models import Trip
from apps.authentication.serializers import UserPublicSerializer

class RequestTitipanSerializer(serializers.ModelSerializer):
    shopper = UserPublicSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = RequestTitipan
        fields = [
            'id', 'shopper', 'item_name', 'category', 'product_url',
            'image_url', 'origin_country', 'origin_city', 'destination_city',
            'estimated_price_idr', 'offered_tip_fee_idr', 'quantity',
            'weight_est_kg', 'deadline_date', 'status', 'notes',
            'is_expired', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def get_is_expired(self, obj) -> bool:
        return obj.deadline_date < timezone.now().date()

    def validate_deadline_date(self, value):
        if value <= timezone.now().date():
            raise serializers.ValidationError("Batas waktu (deadline) harus lebih besar dari hari ini.")
        return value

    def validate_weight_est_kg(self, value):
        if value <= Decimal('0.0'):
            raise serializers.ValidationError("Estimasi berat harus lebih besar dari 0 kg.")
        if value > Decimal('25.0'):
            raise serializers.ValidationError("Maksimal estimasi berat titipan per item adalah 25 kg.")
        return value

    def validate(self, attrs):
        # Validasi keamanan: estimasi harga & fee tidak boleh negatif
        price = attrs.get('estimated_price_idr', Decimal('0'))
        fee = attrs.get('offered_tip_fee_idr', Decimal('0'))
        if price <= 0:
            raise serializers.ValidationError({'estimated_price_idr': "Estimasi harga barang wajib valid."})
        if fee < Decimal('10000'):
            raise serializers.ValidationError({'offered_tip_fee_idr': "Tawaran jasa titip minimal Rp 10.000."})
        return attrs

    def create(self, validated_data):
        # Otomatis kaitkan shopper dengan user yang sedang terautentikasi (JWT)
        user = self.context['request'].user
        return RequestTitipan.objects.create(shopper=user, **validated_data)


class MatchedTripSerializer(serializers.ModelSerializer):
    traveller = UserPublicSerializer(read_only=True)
    match_score = serializers.IntegerField(read_only=True)
    compatibility_reasons = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'traveller', 'origin_country', 'origin_city',
            'destination_country', 'destination_city',
            'departure_date', 'arrival_date',
            'available_baggage_kg', 'fee_per_kg',
            'accepted_categories', 'match_score', 'compatibility_reasons'
        ]`
  },
  {
    id: 'django-views',
    filename: 'backend-django/apps/requests/views.py',
    language: 'python',
    title: 'Django REST Framework: API Views & Matching Engine',
    description: 'ViewSet CRUD untuk Request Titipan dan Matching Algorithm yang mencocokkan rute penerbangan, kuota bagasi, dan rentang tanggal kedatangan.',
    code: `from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import RequestTitipan
from .serializers import RequestTitipanSerializer, MatchedTripSerializer
from apps.trips.models import Trip
from utils.permissions import IsShopperOrReadOnly

class RequestTitipanViewSet(viewsets.ModelViewSet):
    """
    CRUD Endpoint Permintaan Titip Barang:
    - GET /api/v1/requests/ (Filter negara, kota, kategori, search item)
    - POST /api/v1/requests/ (Hanya user dengan role shopper/penitip)
    - GET /api/v1/requests/{id}/
    """
    serializer_class = RequestTitipanSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsShopperOrReadOnly]

    def get_queryset(self):
        queryset = RequestTitipan.objects.select_related('shopper', 'shopper__profile').all()
        origin_country = self.request.query_params.get('origin_country')
        destination_city = self.request.query_params.get('destination_city')
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status', 'OPEN')

        if origin_country:
            queryset = queryset.filter(origin_country__iexact=origin_country)
        if destination_city:
            queryset = queryset.filter(destination_city__iexact=destination_city)
        if category:
            queryset = queryset.filter(category__iexact=category)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')


class MatchTripAPIView(APIView):
    """
    Matching Engine: Mencocokkan Request Titip tertentu dengan Trip Penerbangan Traveller yang aktif.
    Kriteria Kecocokan:
    1. Kesesuaian Rute (Negara/Kota Asal & Tujuan).
    2. Tanggal Tiba Traveller <= Batas Waktu (Deadline) Barang.
    3. Sisa Kuota Bagasi Traveller >= Estimasi Berat Barang.
    4. Kategori Barang diizinkan oleh Traveller.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, request_id):
        try:
            req_item = RequestTitipan.objects.get(id=request_id)
        except RequestTitipan.DoesNotExist:
            return Response(
                {"status": "error", "message": "Request titipan tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cari Trip aktif yang memenuhi kriteria geografis dan waktu
        matching_trips = Trip.objects.filter(
            is_active=True,
            origin_country__iexact=req_item.origin_country,
            arrival_date__lte=req_item.deadline_date,
            arrival_date__gte=timezone.now().date(),
            available_baggage_kg__gte=req_item.weight_est_kg
        ).select_related('traveller', 'traveller__profile')

        results = []
        for trip in matching_trips:
            # Hitung Match Score (0 - 100)
            score = 70
            reasons = []

            # Bonus score jika kota asal sama persis
            if trip.origin_city.lower() == req_item.origin_city.lower():
                score += 15
                reasons.append(f"Kota asal persis sama ({trip.origin_city})")
            else:
                reasons.append(f"Negara asal sama ({trip.origin_country})")

            # Bonus score jika tiba beberapa hari sebelum deadline
            days_before_deadline = (req_item.deadline_date - trip.arrival_date).days
            if days_before_deadline >= 3:
                score += 10
                reasons.append(f"Tiba {days_before_deadline} hari sebelum deadline Anda")

            # Cek izin kategori
            if req_item.category in trip.accepted_categories:
                score += 5
                reasons.append(f"Traveller menerima kategori {req_item.category}")

            trip.match_score = min(score, 100)
            trip.compatibility_reasons = reasons
            results.append(trip)

        # Urutkan berdasarkan score tertinggi
        results.sort(key=lambda x: getattr(x, 'match_score', 0), reverse=True)
        serializer = MatchedTripSerializer(results, many=True)

        return Response({
            "status": "success",
            "request_id": str(req_item.id),
            "item_name": req_item.item_name,
            "total_matches": len(results),
            "matches": serializer.data
        })`
  },
  {
    id: 'django-escrow',
    filename: 'backend-django/apps/escrow/services.py',
    language: 'python',
    title: 'Django Escrow Service: Concurrency-Safe Fund Holding',
    description: 'Implementasi rekening bersama aman terhadap race-condition menggunakan database transaction atomic dan select_for_update() row-locking.',
    code: `from django.db import transaction
from decimal import Decimal
from apps.orders.models import Order
from apps.escrow.models import PaymentEscrow
from utils.event_bus import publish_event
import uuid

class EscrowService:
    PLATFORM_FEE_PERCENT = Decimal('0.05')  # 5% platform fee

    @classmethod
    @transaction.atomic
    def lock_funds_for_order(cls, order_id: str, pg_reference_id: str) -> PaymentEscrow:
        """
        Mengunci dana pembayaran ke Escrow secara atomik.
        Mencegah double-spending dengan SELECT FOR UPDATE.
        """
        order = Order.objects.select_for_update().get(id=order_id)
        
        if order.status != Order.Status.PENDING_CONFIRMATION:
            raise ValueError(f"Order status invalid: {order.status}")

        escrow, created = PaymentEscrow.objects.select_for_update().get_or_create(
            order=order,
            defaults={
                'amount_held': order.total_amount,
                'status': PaymentEscrow.EscrowStatus.HELD,
                'pg_reference_id': pg_reference_id
            }
        )

        if not created:
            escrow.status = PaymentEscrow.EscrowStatus.HELD
            escrow.pg_reference_id = pg_reference_id
            escrow.save()

        # Update order status
        order.status = Order.Status.ESCROW_PAID
        order.save()

        # Broadcast event ke Redis Pub/Sub untuk di-consume oleh Golang service
        publish_event(channel="order:events", payload={
            "event_type": "ESCROW_LOCKED",
            "order_id": str(order.id),
            "shopper_id": str(order.shopper_id),
            "traveller_id": str(order.traveller_id),
            "amount_held": str(escrow.amount_held)
        })

        return escrow

    @classmethod
    @transaction.atomic
    def release_funds_to_traveller(cls, order_id: str, confirmed_by_user_id: str) -> bool:
        """
        Mencairkan dana dari Escrow ke saldo dompet traveller setelah diverifikasi penitip.
        """
        order = Order.objects.select_for_update().get(id=order_id)
        if str(order.shopper_id) != str(confirmed_by_user_id):
            raise PermissionError("Hanya shopper pemesan yang berhak melepaskan dana escrow.")

        escrow = PaymentEscrow.objects.select_for_update().get(order=order)
        if escrow.status != PaymentEscrow.EscrowStatus.HELD:
            raise ValueError("Dana escrow belum terkunci atau telah dicairkan sebelumnya.")

        # Cairkan ke dompet traveller (agreed_item_price + agreed_jastip_fee)
        payout_amount = order.agreed_item_price + order.agreed_jastip_fee
        traveller_profile = order.traveller.profile
        traveller_profile.wallet_balance += payout_amount
        traveller_profile.save()

        # Update status escrow & order
        escrow.status = PaymentEscrow.EscrowStatus.RELEASED_TO_TRAVELLER
        escrow.save()

        order.status = Order.Status.COMPLETED
        order.save()

        publish_event(channel="order:events", payload={
            "event_type": "ESCROW_RELEASED",
            "order_id": str(order.id),
            "traveller_payout": str(payout_amount)
        })

        return True`
  },
  {
    id: 'golang-main',
    filename: 'microservice-golang/cmd/server/main.go',
    language: 'go',
    title: 'Golang Microservice: High-Throughput Tracking Service',
    description: 'Server Gin berkinerja tinggi, inisialisasi koneksi PostgreSQL pool, Redis subscriber goroutine, dan registrasi router HTTP & WebSocket.',
    code: `package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"jastip-tracking/internal/delivery/http/handler"
	"jastip-tracking/internal/delivery/websocket"
	"jastip-tracking/internal/repository"
	"jastip-tracking/internal/service"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=jastip_user password=jastip_secret dbname=jastip_db port=5432 sslmode=disable"
	}

	// 1. Inisialisasi Database Pool PostgreSQL dengan GORM
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Gagal terhubung ke PostgreSQL: %v", err)
	}

	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetMaxIdleConns(20)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 2. Inisialisasi Redis Client
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	// 3. Inisialisasi Repositori & Service
	trackingRepo := repository.NewTrackingRepository(db, rdb)
	wsHub := websocket.NewHub()
	go wsHub.Run()

	trackingService := service.NewTrackingService(trackingRepo, rdb, wsHub)

	// 4. Goroutine: Mendengarkan Event Pub/Sub dari Django Core
	go trackingService.SubscribeToDjangoEvents(context.Background())

	// 5. Setup Router Gin
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery(), gin.Logger())

	// CORS Middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Register Handlers
	trackingHandler := handler.NewTrackingHandler(trackingService)
	v1 := router.Group("/api/v1")
	{
		v1.POST("/tracking/events", trackingHandler.RecordMilestone)
		v1.GET("/tracking/:order_id/timeline", trackingHandler.GetTimeline)
		v1.POST("/webhooks/courier", trackingHandler.HandleCourierWebhook)
	}

	// WebSocket Endpoint
	router.GET("/ws/v1/orders/:order_id/stream", func(c *gin.Context) {
		websocket.ServeWs(wsHub, c.Writer, c.Request, c.Param("order_id"))
	})

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	go func() {
		log.Printf("Golang Tracking Microservice aktif di port :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP listen error: %s\\n", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Mematikan Golang Microservice secara aman...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}`
  },
  {
    id: 'golang-handler',
    filename: 'microservice-golang/internal/delivery/http/handler/tracking_handler.go',
    language: 'go',
    title: 'Golang Handler: Event Ingestion & Webhook Verifier',
    description: 'Endpoint handler Gin berkecepatan tinggi: memvalidasi input JSON, menyimpan ke PostgreSQL, dan menyebarkan update ke WebSocket & Redis dalam hitungan milidetik.',
    code: `package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"jastip-tracking/internal/domain"
	"jastip-tracking/internal/service"
)

type TrackingHandler struct {
	svc *service.TrackingService
}

func NewTrackingHandler(svc *service.TrackingService) *TrackingHandler {
	return &TrackingHandler{svc: svc}
}

type RecordEventPayload struct {
	OrderID         string \`json:"order_id" binding:"required"\`
	Status          string \`json:"status" binding:"required"\`
	Title           string \`json:"title" binding:"required"\`
	Location        string \`json:"location" binding:"required"\`
	Description     string \`json:"description"\`
	ReceiptPhotoURL string \`json:"receipt_photo_url"\`
}

// RecordMilestone: Menangani pencatatan status barang oleh Traveller
func (h *TrackingHandler) RecordMilestone(c *gin.Context) {
	start := time.Now()
	var payload RecordEventPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Payload tidak valid: " + err.Error(),
		})
		return
	}

	event := domain.TrackingEvent{
		OrderID:         payload.OrderID,
		Status:          payload.Status,
		Title:           payload.Title,
		Location:        payload.Location,
		Description:     payload.Description,
		ReceiptPhotoURL: payload.ReceiptPhotoURL,
		ActorRole:       "traveller",
		CreatedAt:       time.Now(),
	}

	savedEvent, err := h.svc.RecordAndBroadcast(c.Request.Context(), event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":         true,
		"event_id":        savedEvent.ID,
		"elapsed_latency": time.Since(start).String(),
		"message":         "Milestone tercatat dan di-broadcast secara real-time.",
	})
}

// GetTimeline: Mengembalikan riwayat pelacakan (Cached Redis)
func (h *TrackingHandler) GetTimeline(c *gin.Context) {
	orderID := c.Param("order_id")
	timeline, err := h.svc.GetOrderTimeline(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data timeline"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id": orderID,
		"events":   timeline,
	})
}

// HandleCourierWebhook: Ingestion webhook ekspedisi lokal dengan verifikasi HMAC
func (h *TrackingHandler) HandleCourierWebhook(c *gin.Context) {
	webhookSecret := "jastip-courier-webhook-secret-key-32b"
	clientSignature := c.GetHeader("X-Courier-Signature")

	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca body webhook"})
		return
	}

	// Verifikasi HMAC-SHA256 signature
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(bodyBytes)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if clientSignature != "" && clientSignature != expectedSignature {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tanda tangan HMAC webhook tidak sah"})
		return
	}

	// Proses update status pengiriman kurir lokal
	c.JSON(http.StatusOK, gin.H{
		"received": true,
		"status":   "PROCESSED",
	})
}`
  },
  {
    id: 'docker-compose',
    filename: 'docker-compose.yml',
    language: 'yaml',
    title: 'Deployment: Docker Compose Multi-Service Architecture',
    description: 'Konfigurasi orkestrasi container produksi untuk Django Core, Golang Microservice, PostgreSQL 16, Redis 7, Celery Worker, dan Nginx Reverse Proxy.',
    code: `version: '3.9'

services:
  # Database Utama (PostgreSQL 16)
  postgres:
    image: postgres:16-alpine
    container_name: jastip_postgres
    restart: always
    environment:
      POSTGRES_DB: jastip_db
      POSTGRES_USER: jastip_user
      POSTGRES_PASSWORD: jastip_super_secret_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jastip_user -d jastip_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Message Broker & Cache (Redis 7)
  redis:
    image: redis:7.2-alpine
    container_name: jastip_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Backend Core: Python Django & DRF
  backend-django:
    build:
      context: ./backend-django
      dockerfile: Dockerfile
    container_name: jastip_backend_django
    restart: always
    command: gunicorn jastip_core.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 2
    environment:
      - DATABASE_URL=postgres://jastip_user:jastip_super_secret_password@postgres:5432/jastip_db
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=django-insecure-production-key-change-in-env
      - DEBUG=False
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    ports:
      - "8000:8000"

  # Celery Asynchronous Task Worker
  celery-worker:
    build:
      context: ./backend-django
      dockerfile: Dockerfile
    container_name: jastip_celery_worker
    restart: always
    command: celery -A jastip_core worker -l info -c 4
    environment:
      - DATABASE_URL=postgres://jastip_user:jastip_super_secret_password@postgres:5432/jastip_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - backend-django
      - redis

  # Microservice Real-time Tracking & WebSocket: Golang
  microservice-golang:
    build:
      context: ./microservice-golang
      dockerfile: Dockerfile
    container_name: jastip_golang_tracking
    restart: always
    environment:
      - PORT=8080
      - DATABASE_URL=host=postgres user=jastip_user password=jastip_super_secret_password dbname=jastip_db port=5432 sslmode=disable
      - REDIS_ADDR=redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    ports:
      - "8080:8080"

  # Nginx Gateway & Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: jastip_gateway
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend-django
      - microservice-golang

volumes:
  postgres_data:
  redis_data:`
  }
];
