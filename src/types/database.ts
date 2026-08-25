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

export interface EmergencyContact {
  name: string;
  phone: string;
  role: string;
}

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
  emergency_contacts: EmergencyContact[];
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
  /** Row indices that render as a contiguous bench with no aisle gap — the
   * real 4/5-across back row many coaches have. The aisle itself is a CSS
   * gutter after `aisleAfterCol`, not a seat column, so this can't be
   * inferred from seat presence; it has to be declared explicitly. */
  fullWidthRows?: number[];
  /** Non-bookable landmark cells — door and toilet placements from the Fleet
   * Builder. Driver placements are a real `seats` row instead (seat_type
   * already models "driver"); doors/toilets have no seat identity at all,
   * so they live here rather than inventing seat rows nothing ever sells. */
  layoutMarkers?: Array<{ row: number; col: number; kind: "door" | "toilet" }>;
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
  standardPrice: PriceQuote | null;
  /** Null when the operator hasn't configured a premium fare for this
   * segment — VIP seats then fall back to the standard price. */
  premiumPrice: PriceQuote | null;
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

/** What the conductor's scanner actually needs: cryptographic validity PLUS
 * "is this the right bus" and "is this ticket even still active" — a
 * technically well-signed ticket for tomorrow's trip, or a cancelled one,
 * must still flash red at today's door. */
export type BoardingScanResult =
  | {
      valid: true;
      alreadyCheckedIn: boolean;
      ticket: {
        ticketNumber: string;
        seatNumber: string;
        passengerName: string;
        originCity: string;
        destinationCity: string;
        fareClass: FareClass;
      };
    }
  | { valid: false; reason: "bad_signature" | "malformed" | "unknown_key_version" | "wrong_trip" | "not_found" | "not_boardable" };

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

/** A just-issued ticket enriched with its seat number — genuinely useful at
 * the moment of purchase (rendering the wallet pass) and cheap to include
 * since the issuing transaction already loaded the seat row. Not part of
 * `TicketRow` itself: `tickets` has no seat_number column, it's joined from
 * `seats` via seat_id, same as any other GET of a ticket would need to do. */
export interface IssuedTicket extends TicketRow {
  seat_number: string;
}

export interface CreateBookingResult {
  booking: BookingRow;
  tickets: IssuedTicket[];
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
  /** Full route's stop count and index bounds, so the UI can plot this
   * segment's position within the larger N-stop graph without a second
   * fetch of every route_stop. */
  routeStopCount: number;
  routeStartOrderIndex: number;
  routeEndOrderIndex: number;
}

export interface TripDetail {
  trip: TripRow;
  company: Pick<CompanyRow, "id" | "name" | "slug" | "logo_url" | "brand_primary_color" | "is_verified">;
  route: Pick<RouteRow, "id" | "name">;
  vehicle: Pick<VehicleRow, "id" | "vehicle_type" | "seat_layout">;
  stops: Array<{
    routeStopId: RouteStopId;
    stopId: StopId;
    name: string;
    city: string;
    orderIndex: number;
    latitude: number;
    longitude: number;
    scheduledArrival: ISODateTime;
    scheduledDeparture: ISODateTime;
  }>;
}

export interface ResolvedStopStub {
  routeStopId: RouteStopId;
  stopId: StopId;
  name: string;
  city: string;
  orderIndex: number;
  scheduledDeparture: ISODateTime;
  scheduledArrival: ISODateTime;
}

// ----------------------------------------------------------------------------
// Operator dashboard — read/write surface for the carrier's own back office.
// Scoped by company slug in the URL (no live Supabase Auth project in this
// environment to gate a real session against; every operator API route
// still enforces the route/trip actually belongs to the resolved company,
// which is the tenant boundary that matters — see api/operator/**).
// ----------------------------------------------------------------------------

export interface OperatorCompanySummary {
  id: CompanyId;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandPrimaryColor: HexColor;
  isVerified: boolean;
  status: CompanyStatus;
}

export interface OperatorOverview {
  company: OperatorCompanySummary;
  tripsToday: number;
  seatsSoldToday: number;
  revenueToday: number;
  currency: CurrencyCode;
  liveSeatLocks: number;
  upcomingDepartures: Array<{
    tripId: TripId;
    routeName: string;
    departureAt: ISODateTime;
    vehicleType: VehicleTypeEnum;
    status: TripStatus;
    seatsSold: number;
    totalSeats: number;
  }>;
}

export interface OperatorRouteSummary {
  id: RouteId;
  name: string;
  slug: string;
  isActive: boolean;
  stopCount: number;
  distanceKm: number | null;
  upcomingTripCount: number;
  firstStopCity: string | null;
  lastStopCity: string | null;
}

export interface OperatorRouteStop {
  routeStopId: RouteStopId;
  stopId: StopId;
  name: string;
  city: string;
  orderIndex: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
}

/** One matrix cell: null `priceAmount` means the operator hasn't priced this
 * origin/destination pair yet (destination must still be reachable — the
 * editor only renders cells where destination.orderIndex > origin.orderIndex). */
export interface OperatorPricingCell {
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  priceAmount: number | null;
  currency: CurrencyCode;
}

export interface OperatorRouteDetail {
  id: RouteId;
  name: string;
  slug: string;
  isActive: boolean;
  distanceKm: number | null;
  stops: OperatorRouteStop[];
  /** Flattened matrix cells for `fareClass: "standard"` — the editor's grid
   * reconstructs the 2D layout client-side from `stops` order. */
  pricingCells: OperatorPricingCell[];
}

export interface UpdatePricingCellInput {
  originRouteStopId: RouteStopId;
  destinationRouteStopId: RouteStopId;
  fareClass: FareClass;
  priceAmount: number;
}

export interface OperatorTripSummary {
  id: TripId;
  routeName: string;
  vehicleType: VehicleTypeEnum;
  departureAt: ISODateTime;
  status: TripStatus;
  seatsSold: number;
  totalSeats: number;
  revenue: number;
  currency: CurrencyCode;
}

// -- Carrier profile (onboarding / settings) --------------------------------

export interface OperatorCompanyProfile {
  id: CompanyId;
  name: string;
  slug: string;
  legalName: string | null;
  fiscalCode: string | null;
  supportPhone: string | null;
  supportEmail: string | null;
  logoUrl: string | null;
  brandPrimaryColor: HexColor;
  brandSecondaryColor: HexColor;
  emergencyContacts: EmergencyContact[];
  status: CompanyStatus;
  isVerified: boolean;
}

export interface UpdateCompanyProfileInput {
  legalName?: string | null;
  fiscalCode?: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
  logoUrl?: string | null;
  brandPrimaryColor?: HexColor;
  brandSecondaryColor?: HexColor;
  emergencyContacts?: EmergencyContact[];
}

// -- Fleet builder -----------------------------------------------------------

export interface OperatorFleetVehicleSummary {
  id: VehicleId;
  registrationPlate: string;
  vehicleType: VehicleTypeEnum;
  totalSeats: number;
  isActive: boolean;
  upcomingTripCount: number;
}

export interface OperatorVehicleDetail {
  id: VehicleId | null;
  registrationPlate: string;
  vehicleType: VehicleTypeEnum;
  seatLayout: SeatLayout;
  seats: Array<{ seatNumber: string; rowNumber: number; colPosition: number; deck: number; seatType: SeatTypeEnum }>;
}

export interface SaveFleetVehicleInput {
  vehicleId: VehicleId | null; // null = create
  registrationPlate: string;
  vehicleType: VehicleTypeEnum;
  seatLayout: SeatLayout;
  seats: Array<{ seatNumber: string; rowNumber: number; colPosition: number; deck: number; seatType: SeatTypeEnum }>;
}

// -- Trip control & passenger manifest ---------------------------------------

export interface OperatorManifestEntry {
  ticketId: TicketId;
  ticketNumber: string;
  passengerName: string;
  passengerPhone: string | null;
  seatNumber: string;
  originCity: string;
  destinationCity: string;
  fareClass: FareClass;
  priceAmount: number;
  currency: CurrencyCode;
  status: TicketStatus;
}

export interface OperatorTripManifest {
  trip: {
    id: TripId;
    routeName: string;
    departureAt: ISODateTime;
    status: TripStatus;
    vehicleType: VehicleTypeEnum;
    registrationPlate: string;
  };
  boardingStops: Array<{ routeStopId: RouteStopId; city: string; orderIndex: number }>;
  passengers: OperatorManifestEntry[];
}

// ----------------------------------------------------------------------------
// API envelope types
// ----------------------------------------------------------------------------

export interface ApiError {
  code:
    | "SEGMENT_INVALID_ORDER"
    | "STOP_ORDER_NOT_FOUND"
    | "SEAT_UNAVAILABLE"
    | "LOCK_EXPIRED"
    | "LOCK_NOT_FOUND"
    | "PRICE_NOT_FOUND"
    | "TICKET_SIGNATURE_INVALID"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "UNAUTHORIZED"
    | "INTERNAL_ERROR";
  message: string;
  details?: unknown;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
