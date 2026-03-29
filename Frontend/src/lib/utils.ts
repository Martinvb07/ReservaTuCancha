import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const SPORT_LABELS: Record<string, string> = {
  futbol: "Futbol",
  padel: "Padel",
  voley_playa: "Voley Playa",
}

export function formatCurrency(amount: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
