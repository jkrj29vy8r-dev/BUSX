// ============================================================================
// BUSX — Strict domain TypeScript interfaces
//
// These mirror prisma/schema.prisma + supabase/migrations/0001_init_busx_core.sql.
// Row types are the literal DB shape (branded ids, ISO date strings — this is
// what comes back over the wire from Supabase/Prisma, not Date objects).
// Domain/DTO types below them are what the API layer and UI actually consume.
// ============================================================================

// ----------------------------------------------------------------------------
// Branded IDs — prevents accidentally passing a SeatId where a TripId is
// expected; both are plain strings at runtime.
// ----------------------------------------------------------------------------
type Brand<T, B extends string> = T & { readonly __brand: B };

export type CompanyId = Brand<string, "CompanyId">;
export type ProfileId = Brand<string, "ProfileId">;
export type StopId = Brand<string, "StopId">;
export type RouteId = Brand<string, "RouteId">;
export type RouteStopId = Brand<string, "RouteStopId">;
export type PricingId = Brand<string, "PricingId">;
export type VehicleId = Brand<string, "VehicleId">;
export type SeatId = Brand<string, "SeatId">;
export type TripId = Brand<string, "TripId">;
export type TripStopTimeId = Brand<string, "TripStopTimeId">;
export type BookingId = Brand<string, "BookingId">;
export type SeatLockId = Brand<string, "SeatLockId">;
export type TicketId = Brand<string, "TicketId">;

export type ISODateTime = string; // e.g. "2026-08-24T14:30:00.000Z"
export type ISODate = string; // e.g. "2026-08-24"
export type HexColor = `#${string}`;
export type CurrencyCode = "RON" | "EUR" | "USD" | (string & {});

// ----------------------------------------------------------------------------
// Enums (must match Postgres enum types exactly)
// ----------------------------------------------------------------------------
export type UserRole = "passenger" | "operator_admin" | "conductor" | "super_admin";
export type CompanyStatus = "pending" | "active" | "suspended" | "terminated";
export type VehicleTypeEnum = "minibus_16" | "sprinter_19" | "isuzu_30" | "coach_50" | "double_decker_70" | "custom";
export type SeatTypeEnum = "standard" | "premium" | "disabled_access" | "driver" | "conductor";
export type TripStatus = "scheduled" | "boarding" | "departed" | "in_transit" | "completed" | "cancelled" | "delayed";
export type StopEventStatus = "pending" | "arrived" | "departed" | "skipped";
export type LockStatus = "active" | "released" | "converted" | "expired";
export type TicketStatus =
  | "reserved"
  | "paid"
  | "checked_in"
  | "boarded"
  | "cancelled"
  | "refunded"
  | "expired"
  | "no_show";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type FareClass = "standard" | "premium" | "student" | "senior";

// ----------------------------------------------------------------------------
// Row types (1:1 with DB tables)
// ----------------------------------------------------------------------------

export interface CompanyRow {
  id: CompanyId;
  name: string;
  slug: string;
  legal_name: string | null;
  fiscal_code: string | null;
  brand_primary_color: HexColor;
  brand_secondary_color: HexColor;
  logo_url: string | null;
  support_phone: string | null;
  support_email: string | null;
  commission_rate_pct: number;
  status: CompanyStatus;
  is_verified: boolean;
  verified_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface ProfileRow {
  id: ProfileId;
  role: UserRole;
  company_id: CompanyId | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface StopRow {
  id: StopId;
  name: string;
  city: string;
  county: string | null;
  country_code: string;
  station_code: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  is_airport: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface RouteRow {
  id: RouteId;
  company_id: CompanyId;
  name: string;
  slug: string;
  distance_km: number | null;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** A single node in the N-stop route graph. order_index is canonical sequence. */
export interface RouteStopRow {
  id: RouteStopId;
  route_id: RouteId;
  stop_id: StopId;
  order_index: number;
  arrival_offset_minutes: number;
  departure_offset_minutes: number;
  distance_from_start_km: number | null;
  platform_or_gate: string | null;
  is_pickup_point: boolean;
  is_dropoff_point: boolean;
  created_at: ISODateTime;
}

export interface SegmentPricingMatrixRow {
  id: PricingId;
  route_id: RouteId;
  origin_route_stop_id: RouteStopId;
  destination_route_stop_id: RouteStopId;
  fare_class: FareClass;
  price_amount: number;
  currency: CurrencyCode;
  valid_from: ISODate;
  valid_until: ISODate | null;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface SeatLayout {
  rows: number;
  cols: number;
  aisleAfterCol: number;
  deck: number;
  disabledCells?: Array<[row: number, col: number]>;
  layoutVersion: number;
}

export interface VehicleAmenity {
  key: "wifi" | "ac" | "usb_charging" | "toilet" | "reclining_seats" | "entertainment_system";
  label: string;
}

export interface VehicleRow {
  id: VehicleId;
  company_id: CompanyId;
  registration_plate: string;
  vehicle_type: VehicleTypeEnum;
  total_seats: number;
  seat_layout: SeatLayout;
  amenities: VehicleAmenity[];
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface SeatRow {
  id: SeatId;
  vehicle_id: VehicleId;
  seat_number: string;
  row_number: number;
  col_position: number;
  deck: number;
  seat_type: SeatTypeEnum;
  is_bookable: boolean;
  created_at: ISODateTime;
}

export interface TripRow {
  id: TripId;
  route_id: RouteId;
  vehicle_id: VehicleId;
  company_id: CompanyId;
  driver_id: ProfileId | null;
  conductor_id: ProfileId | null;
  departure_at: ISODateTime;
  status: TripStatus;
  currency: CurrencyCode;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface TripStopTimeRow {
  id: TripStopTimeId;
  trip_id: TripId;
  route_stop_id: RouteStopId;
  scheduled_arrival: ISODateTime;
  scheduled_departure: ISODateTime;
  actual_arrival: ISODateTime | null;
  actual_departure: ISODateTime | null;
  status: StopEventStatus;
}

export interface BookingRow {
  id: BookingId;
  booking_number: string;
  user_id: ProfileId | null;
  contact_email: string;
  contact_phone: string | null;
  total_amount: number;
  currency: CurrencyCode;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_reference: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** A temporary (10-minute) hold on one seat for one segment of one trip. */
export interface SeatLockRow {
  id: SeatLockId;
  trip_id: TripId;
  seat_id: SeatId;
  origin_route_stop_id: RouteStopId;
  destination_route_stop_id: RouteStopId;
  origin_order_index: number;
  destination_order_index: number;
  locked_by_user_id: ProfileId | null;
  session_id: string;
  status: LockStatus;
  expires_at: ISODateTime;
  created_at: ISODateTime;
}

export interface TicketRow {
  id: TicketId;
  ticket_number: string;
  booking_id: BookingId;
  trip_id: TripId;
  seat_id: SeatId;
  origin_route_stop_id: RouteStopId;
  destination_route_stop_id: RouteStopId;
  origin_order_index: number;
  destination_order_index: number;
  passenger_id: ProfileId | null;
  passenger_full_name: string;
  passenger_phone: string | null;
  passenger_email: string | null;
  fare_class: FareClass;
  price_amount: number;
  currency: CurrencyCode;
  status: TicketStatus;
  qr_payload: string;
  hmac_signature: string;
  signature_key_version: number;
  issued_at: ISODateTime;
  checked_in_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

// ----------------------------------------------------------------------------
// Domain / DTO types — what the API and services actually pass around
// ----------------------------------------------------------------------------

/** One [origin, destination) leg a passenger searches or books. Always
 * expressed via order_index so overlap math is a plain interval comparison. */
export interface SegmentRequest {
  tripId: TripId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
}

export interface ResolvedSegment extends SegmentRequest {
  originOrderIndex: number;
  destinationOrderIndex: number;
}

export interface SeatAvailability {
  seatId: SeatId;
  seatNumber: string;
  rowNumber: number;
  colPosition: number;
  deck: number;
  seatType: SeatTypeEnum;
  isAvailable: boolean;
}

export interface SegmentSeatMap {
  trip: Pick<TripRow, "id" | "departure_at" | "status" | "currency">;
  segment: ResolvedSegment;
  vehicleLayout: SeatLayout;
  seats: SeatAvailability[];
}

export interface PriceQuote {
  routeId: RouteId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  fareClass: FareClass;
  amount: number;
  currency: CurrencyCode;
}

export interface CreateSeatLockInput {
  tripId: TripId;
  seatId: SeatId;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  sessionId: string;
  lockedByUserId?: ProfileId;
  ttlSeconds?: number; // default 600 (10 min)
}

export interface SeatLockResult {
  lock: SeatLockRow;
  expiresInSeconds: number;
}

/** The canonical, order-stable object that gets JSON-stringified and HMAC-signed
 * to produce Ticket.qr_payload. Field order matters for byte-identical
 * re-serialization during offline verification — always build this via
 * `buildQrPayload()`, never hand-construct the JSON string. */
export interface TicketQrPayloadV1 {
  v: 1;
  ticketNumber: string;
  ticketId: TicketId;
  tripId: TripId;
  seatId: SeatId;
  seatNumber: string;
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  fareClass: FareClass;
  issuedAt: ISODateTime;
  keyVersion: number;
}

export interface SignedTicketQr {
  payload: TicketQrPayloadV1;
  payloadJson: string;
  signature: string; // hex-encoded HMAC-SHA256
  qrString: string; // `${base64url(payloadJson)}.${signature}` — what actually goes in the QR code
}

export type TicketVerificationResult =
  | { valid: true; payload: TicketQrPayloadV1 }
  | { valid: false; reason: "bad_signature" | "malformed" | "unknown_key_version" };

export interface CreateBookingInput {
  contactEmail: string;
  contactPhone?: string;
  userId?: ProfileId;
  sessionId: string;
  passengers: Array<{
    seatLockId: SeatLockId;
    fullName: string;
    phone?: string;
    email?: string;
    fareClass: FareClass;
  }>;
  paymentProvider: string;
}

export interface CreateBookingResult {
  booking: BookingRow;
  tickets: TicketRow[];
}

export interface TripSearchQuery {
  originStopId: StopId;
  destinationStopId: StopId;
  date: ISODate;
  passengers?: number;
  fareClass?: FareClass;
}

export interface TripSearchResult {
  trip: TripRow;
  company: Pick<CompanyRow, "id" | "name" | "slug" | "logo_url" | "brand_primary_color" | "is_verified">;
  route: Pick<RouteRow, "id" | "name">;
  origin: ResolvedStopStub;
  destination: ResolvedStopStub;
  price: PriceQuote;
  availableSeatsCount: number;
  vehicleType: VehicleTypeEnum;
}

export interface ResolvedStopStub {
  routeStopId: RouteStopId;
  stopId: StopId;
  name: string;
  city: string;
  scheduledDeparture: ISODateTime;
  scheduledArrival: ISODateTime;
}

// ----------------------------------------------------------------------------
// API envelope types
// ----------------------------------------------------------------------------

export interface ApiError {
  code:
    | "SEGMENT_INVALID_ORDER"
    | "SEAT_UNAVAILABLE"
    | "LOCK_EXPIRED"
    | "LOCK_NOT_FOUND"
    | "PRICE_NOT_FOUND"
    | "TICKET_SIGNATURE_INVALID"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "INTERNAL_ERROR";
  message: string;
  details?: unknown;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
