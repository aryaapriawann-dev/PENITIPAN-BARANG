export type UserRole = 'penitip' | 'traveller' | 'admin';

export type RequestStatus = 'OPEN' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'ESCROW_PAID'
  | 'ITEM_PURCHASED'
  | 'IN_TRANSIT'
  | 'ARRIVED_LOCAL'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED';

export type EscrowStatus = 'HELD' | 'RELEASED_TO_TRAVELLER' | 'REFUNDED_TO_PENITIP' | 'DISPUTED';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
  phone: string;
  isVerifiedKtp: boolean;
  rating: number;
  totalTransactions: number;
  walletBalance: number;
}

export interface TripListing {
  id: string;
  travellerId: string;
  travellerName: string;
  travellerRating: number;
  travellerAvatar: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate: string;
  availableBaggageKg: number;
  feePerKg: number;
  acceptedCategories: string[];
  notes: string;
  isActive: boolean;
  createdAt: string;
}

export interface TitipRequest {
  id: string;
  shopperId: string;
  shopperName: string;
  shopperAvatar: string;
  itemName: string;
  category: string;
  productUrl?: string;
  imageUrl: string;
  originCountry: string;
  originCity: string;
  destinationCity: string;
  estimatedPriceIdr: number;
  offeredTipFeeIdr: number;
  quantity: number;
  weightEstKg: number;
  deadlineDate: string;
  status: RequestStatus;
  notes: string;
  createdAt: string;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  receiptPhotoUrl?: string;
  actorRole: 'traveller' | 'system' | 'penitip';
}

export interface JastipOrder {
  id: string;
  orderNumber: string;
  requestId: string;
  tripId?: string;
  shopperId: string;
  shopperName: string;
  travellerId: string;
  travellerName: string;
  itemName: string;
  itemPriceIdr: number;
  jastipFeeIdr: number;
  platformFeeIdr: number;
  totalEscrowAmountIdr: number;
  status: OrderStatus;
  escrowStatus: EscrowStatus;
  createdAt: string;
  trackingEvents: TrackingEvent[];
}

export interface DatabaseField {
  name: string;
  type: string;
  constraints: string;
  description: string;
}

export interface DatabaseModel {
  name: string;
  tableName: string;
  description: string;
  fields: DatabaseField[];
  relations: string[];
  djangoCode: string;
}

export interface ApiEndpoint {
  service: 'Django (Core)' | 'Golang (Real-time Tracking)';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  authRequired: boolean;
  requiredRole?: UserRole | 'authenticated';
  requestBody?: string;
  responseBody: string;
  statusCode: number;
}
