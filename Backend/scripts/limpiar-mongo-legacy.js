/**
 * Limpieza única de datos que quedaron huérfanos en Mongo.
 *
 * Qué borra y por qué:
 *  - clubs.wompi*      → cada club tenía sus propias llaves de Wompi porque el
 *                        pago iba directo a su cuenta. Ahora el cobro entra a la
 *                        cuenta de ReservaTuCancha y se liquida semanalmente,
 *                        así que esas llaves ya no las lee nadie (y son
 *                        credenciales: mejor no dejarlas guardadas).
 *  - colección payments → era de la integración con Stripe, que se retiró.
 *
 * Uso:
 *   node scripts/limpiar-mongo-legacy.js          # simulación, no escribe nada
 *   node scripts/limpiar-mongo-legacy.js --aplicar
 */

require('dotenv').config();
const mongoose = require('mongoose');

const CAMPOS_WOMPI = [
  'wompiMerchantId',
  'wompiPublicKey',
  'wompiApiKey',
  'wompiEventsSecret',
  'wompiIntegritySecret',
  'wompiConfigured',
];

const aplicar = process.argv.includes('--aplicar');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta MONGODB_URI en el .env');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log(`Base: ${db.databaseName}`);
  console.log(aplicar ? '>> MODO REAL: se van a escribir cambios\n' : '>> SIMULACION: no se escribe nada\n');

  // ── 1. Llaves de Wompi en los clubes ──────────────────────────────
  const filtro = { $or: CAMPOS_WOMPI.map((c) => ({ [c]: { $exists: true } })) };
  const afectados = await db.collection('clubs').countDocuments(filtro);

  console.log(`clubs con llaves de Wompi guardadas: ${afectados}`);
  for (const campo of CAMPOS_WOMPI) {
    const n = await db.collection('clubs').countDocuments({ [campo]: { $exists: true } });
    if (n > 0) console.log(`   ${campo}: ${n}`);
  }

  if (aplicar && afectados > 0) {
    const unset = Object.fromEntries(CAMPOS_WOMPI.map((c) => [c, '']));
    const res = await db.collection('clubs').updateMany(filtro, { $unset: unset });
    console.log(`   -> limpiados ${res.modifiedCount} clubes`);
  }

  // ── 2. Colección de pagos de Stripe ───────────────────────────────
  const colecciones = await db.listCollections({ name: 'payments' }).toArray();
  if (colecciones.length === 0) {
    console.log('\ncoleccion payments: no existe, nada que hacer');
  } else {
    const docs = await db.collection('payments').countDocuments();
    console.log(`\ncoleccion payments (Stripe): ${docs} documentos`);
    if (aplicar) {
      await db.collection('payments').drop();
      console.log('   -> eliminada');
    }
  }

  if (!aplicar) console.log('\nNada se modificó. Repite con --aplicar para ejecutarlo.');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
