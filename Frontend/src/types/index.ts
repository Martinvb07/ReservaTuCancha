// ─── Enums ────────────────────────────────────────────────────────────────────
export type SportType = 'futbol' | 'padel' | 'voley_playa';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type UserRole = 'owner' | 'admin';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

// ─── Court ────────────────────────────────────────────────────────────────────
export interface GeoLocation {
  address: string;
  city: string;
  department: string;
  coordinates?: [number, number];
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
}

export interface Court {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  sport: SportType;
  location: GeoLocation;
  pricePerHour: number;
  currency: string;
  photos: string[];
  availability: AvailabilitySlot[];
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CourtsResponse {
  data: Court[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── CourtFilters extendido para SaaS multi-club ───────────────
export interface CourtFilters {
  sport?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  limit?: number;
  ownerId?: string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────
export interface CreateBookingPayload {
  courtId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  players?: number;
  notes?: string;
  totalPrice: number;
}

export interface Booking {
  _id: string;
  courtId: string | Court;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  players: number;
  notes?: string;
  status: BookingStatus;
  totalPrice: number;
  paymentId?: string;
  cancelToken: string;
  reviewToken: string;
  reviewTokenUsed: boolean;
  createdAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: BookingStatus;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  _id: string;
  courtId: string;
  bookingId: string;
  guestName: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: string;
}

export interface CreateReviewPayload {
  reviewToken: string;
  rating: number;
  comment?: string;
}

// ─── User (propietario / admin) ───────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface OwnerStats {
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalCourts: number;
  topCourt: { _id: string; count: number; revenue: number } | null;
}

export interface MonthlyRevenue {
  _id: { year: number; month: number };
  revenue: number;
  count: number;
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface CourtFilters {
  sport?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  limit?: number;
}
