export type SportType = 'futbol' | 'padel' | 'voley_playa';

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
}

export interface CourtsResponse {
  data: Court[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
