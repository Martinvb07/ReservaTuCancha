export const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL && process.env.NEXT_PUBLIC_LOGO_URL.trim() !== ''
    ? process.env.NEXT_PUBLIC_LOGO_URL
    : '/logos/Logo.png';
