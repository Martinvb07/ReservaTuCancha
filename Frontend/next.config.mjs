// En la v11 el wrapper del build vive en su propio punto de entrada.
import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
        ],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
    // Next 14 solo carga src/instrumentation.ts con este flag (Sentry en el servidor).
    experimental: {
        instrumentationHook: true,
    },
};

/* Los source maps solo se suben si hay SENTRY_AUTH_TOKEN en el build; sin él
   el build sigue igual y los errores llegan con el código minificado. */
export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    telemetry: false,
});
