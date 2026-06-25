'use client';

import { motion } from 'framer-motion';

// template.tsx se re-monta en cada navegación → anima el cambio de pantalla.
// Solo opacidad (sin transform) para no afectar los elementos sticky de la página.
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
