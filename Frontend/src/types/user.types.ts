export type UserRole = 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'avatarUrl'>;
}

export interface Review {
  _id: string;
  courtId: string;
  bookingId: string;
  guestName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
