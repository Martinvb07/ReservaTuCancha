export interface Club {
  _id: string;
  name: string;
  logo?: string;
  city?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  sports?: string[];
  totalCourts?: number;
}