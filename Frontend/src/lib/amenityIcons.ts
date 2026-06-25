import { Lightbulb, Car, Droplets, Shirt, Coffee, Users, Wifi, Dumbbell, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icono por amenidad (fuente única, usada en tarjetas, filtros y detalle).
export const AMEN_ICONS: Record<string, LucideIcon> = {
  'Luz nocturna': Lightbulb,
  'Parqueadero': Car,
  'Duchas': Droplets,
  'Vestiarios': Shirt,
  'Cafetería': Coffee,
  'Graderías': Users,
  'Wi-Fi': Wifi,
  'Alquiler de equipos': Dumbbell,
};

/** Devuelve el icono de la amenidad, con un check genérico de fallback. */
export function amenityIcon(name: string): LucideIcon {
  return AMEN_ICONS[name] ?? CheckCircle;
}
