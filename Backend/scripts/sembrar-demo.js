/**
 * Llena la base con clubes, canchas, fotos y reseñas de ejemplo para que la
 * web y la app se vean con contenido.
 *
 * Todo lo que crea lleva `demoSeed: true`, así se puede borrar de un golpe
 * sin tocar nada real.
 *
 * Los dueños de los clubes de ejemplo usan tu correo con "+": si tu correo es
 * yo@gmail.com, quedan como yo+demo-1@gmail.com, yo+demo-2@gmail.com... Gmail
 * los entrega todos a tu bandeja, así que si alguien reserva una cancha de
 * ejemplo te enteras, y ningún correo rebota.
 *
 * Uso (desde la carpeta Backend, con el .env de la base a llenar):
 *   node scripts/sembrar-demo.js --correo yo@gmail.com              # simulación
 *   node scripts/sembrar-demo.js --correo yo@gmail.com --aplicar    # crea todo
 *   node scripts/sembrar-demo.js --borrar                           # simulación del borrado
 *   node scripts/sembrar-demo.js --borrar --aplicar                 # borra todo lo de ejemplo
 *
 * Opciones:
 *   --clubes N     cuántos clubes crear (por defecto 8, máximo 16)
 *   --clave X      contraseña de los dueños de ejemplo (por defecto se genera)
 *
 * OJO: en producción las canchas de ejemplo se pueden reservar y pagar como
 * cualquier otra. Bórralas (--borrar --aplicar) antes de abrir a jugadores
 * reales, o cuando empiecen a entrar clubes de verdad.
 */

require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Argumentos ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const valor = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const aplicar = flag('--aplicar');
const borrar = flag('--borrar');
const correoBase = valor('--correo');
const numClubes = Math.min(Math.max(parseInt(valor('--clubes') ?? '8', 10) || 8, 1), 16);
const clave = valor('--clave') ?? `Demo${crypto.randomInt(1000, 9999)}rtc`;

const MARCA = { demoSeed: true };

// ─── Datos de ejemplo ───────────────────────────────────────────────────────

/* Fotos que ya usa la web: se sabe que cargan y que el next.config las
   permite. Con distintos encuadres para que no se vean todas iguales. */
const FOTOS = {
  futbol: [
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6',
    'https://images.unsplash.com/photo-1459865264687-595d652de67e',
  ],
  padel: ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8'],
  voley_playa: [
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1',
    'https://images.unsplash.com/photo-1519046947096-f43d6481532b',
  ],
};
const ENCUADRES = [
  'w=1200&q=80',
  'w=1200&h=800&fit=crop&crop=entropy&q=80',
  'w=1200&h=800&fit=crop&crop=focalpoint&fp-x=0.3&fp-y=0.6&q=80',
  'w=1200&h=800&fit=crop&crop=focalpoint&fp-x=0.7&fp-y=0.4&q=80',
];

/* Centro aproximado de cada ciudad [lng, lat]; las canchas se reparten
   alrededor para que el mapa no las ponga una encima de otra. */
const CIUDADES = [
  { city: 'Villavicencio', department: 'Meta', centro: [-73.6266, 4.142], barrios: ['Barzal', 'La Esperanza', 'El Buque', 'Caudal', 'Villa Julia'] },
  { city: 'Bogotá', department: 'Cundinamarca', centro: [-74.0721, 4.711], barrios: ['Chapinero', 'Usaquén', 'Suba', 'Kennedy', 'Teusaquillo'] },
  { city: 'Medellín', department: 'Antioquia', centro: [-75.5636, 6.2442], barrios: ['El Poblado', 'Laureles', 'Belén', 'Envigado', 'Robledo'] },
  { city: 'Cali', department: 'Valle del Cauca', centro: [-76.532, 3.4516], barrios: ['Granada', 'Ciudad Jardín', 'San Fernando', 'El Ingenio'] },
  { city: 'Barranquilla', department: 'Atlántico', centro: [-74.7813, 10.9685], barrios: ['El Prado', 'Riomar', 'Alto Prado', 'Villa Country'] },
  { city: 'Bucaramanga', department: 'Santander', centro: [-73.1198, 7.1193], barrios: ['Cabecera', 'Cañaveral', 'Provenza', 'San Alonso'] },
  { city: 'Acacías', department: 'Meta', centro: [-73.7642, 3.9877], barrios: ['Centro', 'Las Ceibas'] },
  { city: 'Restrepo', department: 'Meta', centro: [-73.5665, 4.2608], barrios: ['Centro', 'El Bosque'] },
];

const CLUBES = [
  { nombre: 'Golazo Sports Center', slogan: 'Donde se juega en serio' },
  { nombre: 'La Bombonera Llanera', slogan: 'Fútbol con sabor a llano' },
  { nombre: 'Pádel Club Altos', slogan: 'Tu punto de encuentro' },
  { nombre: 'Arena Beach Club', slogan: 'Arena, sol y partido' },
  { nombre: 'Complejo Deportivo El Estadio', slogan: 'Canchas de primera' },
  { nombre: 'Sintéticas La 40', slogan: 'Juega de día y de noche' },
  { nombre: 'Punto de Oro Pádel', slogan: 'Saque, volea y punto' },
  { nombre: 'Club Deportivo Los Pinos', slogan: 'Deporte en familia' },
  { nombre: 'Cancha Total', slogan: 'Reserva, juega, repite' },
  { nombre: 'Fútbol Park Norte', slogan: 'El mejor césped de la zona' },
  { nombre: 'Smash Pádel Center', slogan: 'Pádel para todos los niveles' },
  { nombre: 'Playa Seca Vóley', slogan: 'La playa en la ciudad' },
  { nombre: 'Distrito Fútbol 5', slogan: 'Partidos rápidos, goles seguros' },
  { nombre: 'La Cancha del Barrio', slogan: 'Como en casa' },
  { nombre: 'Centro Deportivo Horizonte', slogan: 'Más que canchas' },
  { nombre: 'Club Raqueta y Balón', slogan: 'Tu deporte, tu horario' },
];

const CANCHAS = {
  futbol: {
    nombres: ['Fútbol 5 Sintética', 'Fútbol 7 Principal', 'Fútbol 8 Techada', 'Fútbol 5 Norte', 'Fútbol 6 Central'],
    precios: [70000, 80000, 90000, 100000, 120000, 140000],
    descripcion: 'Césped sintético de última generación, arcos reglamentarios e iluminación LED para jugar de noche.',
  },
  padel: {
    nombres: ['Pádel Panorámica 1', 'Pádel Cristal 2', 'Pádel Indoor', 'Pádel Central'],
    precios: [90000, 110000, 120000, 130000, 150000],
    descripcion: 'Pista con paredes de cristal templado, césped de pádel profesional y alquiler de raquetas.',
  },
  voley_playa: {
    nombres: ['Vóley Playa Arena 1', 'Vóley Playa Central', 'Vóley Playa Sunset'],
    precios: [50000, 60000, 70000, 80000],
    descripcion: 'Arena lavada y nivelada, red reglamentaria y zona de sombra para descansar entre sets.',
  },
};

const AMENIDADES = ['Luz nocturna', 'Parqueadero', 'Duchas', 'Vestiarios', 'Cafetería', 'Graderías', 'Wi-Fi', 'Alquiler de equipos'];

const NOMBRES = ['Andrés', 'Camila', 'Juan David', 'Valentina', 'Santiago', 'Daniela', 'Sebastián', 'Laura', 'Mateo', 'Mariana', 'Felipe', 'Sofía', 'Alejandro', 'Natalia', 'Carlos', 'Paula', 'Julián', 'Isabella', 'Diego', 'Juliana'];
const APELLIDOS = ['Gómez', 'Rodríguez', 'Martínez', 'López', 'García', 'Hernández', 'Ramírez', 'Torres', 'Rojas', 'Moreno', 'Castro', 'Vargas'];

const COMENTARIOS = {
  5: ['Excelente cancha, muy bien cuidada. Volvemos seguro.', 'La mejor de la zona, la iluminación es buenísima.', 'Todo perfecto: puntuales, limpio y buena atención.', 'Reservar fue facilísimo y la cancha estaba impecable.', 'Muy buena experiencia, el personal súper amable.'],
  4: ['Muy buena, solo faltó un poco más de parqueadero.', 'Buena cancha y buen precio. Recomendada.', 'Todo bien, los vestiarios podrían estar mejor.', 'Buen ambiente para jugar con los amigos.'],
  3: ['Cumple, aunque el césped ya está algo gastado.', 'Bien en general, pero nos tocó esperar un rato.'],
};

// ─── Utilidades ─────────────────────────────────────────────────────────────

/* Pseudoaleatorio con semilla: dos corridas dan los mismos datos. */
let semilla = 20261103;
const azar = () => {
  semilla = (semilla * 1103515245 + 12345) % 2147483648;
  return semilla / 2147483648;
};
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
const mezclar = (lista) => [...lista].sort(() => azar() - 0.5);

const slugDe = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const correoDemo = (base, n) => {
  const [usuario, dominio] = base.toLowerCase().trim().split('@');
  return `${usuario}+demo-${n}@${dominio}`;
};

const codigoReserva = () => crypto.randomBytes(6).toString('base64').replace(/[^A-Z0-9]/gi, '').toUpperCase().padEnd(8, 'X').slice(0, 8);

const horario = () =>
  [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
    dayOfWeek: dia,
    openTime: dia === 0 ? '08:00' : '06:00',
    closeTime: dia === 0 ? '20:00' : '23:00',
    slotDurationMinutes: 60,
  }));

// ─── Borrar ─────────────────────────────────────────────────────────────────

async function borrarTodo(db) {
  const canchas = await db.collection('courts').find(MARCA, { projection: { _id: 1 } }).toArray();
  const ids = canchas.map((c) => c._id);
  const conteo = {
    users: await db.collection('users').countDocuments(MARCA),
    clubs: await db.collection('clubs').countDocuments(MARCA),
    courts: ids.length,
    reviews: await db.collection('reviews').countDocuments({ $or: [MARCA, { courtId: { $in: ids } }] }),
    bookings: await db.collection('bookings').countDocuments({ $or: [MARCA, { courtId: { $in: ids } }] }),
  };
  console.log('Se borraría:', conteo);
  if (conteo.bookings > 0) {
    const reales = await db.collection('bookings').countDocuments({ courtId: { $in: ids }, demoSeed: { $ne: true } });
    if (reales > 0) {
      console.log(`\n!! ${reales} reservas REALES apuntan a canchas de ejemplo (alguien reservó una). Se borran también.`);
    }
  }
  if (!aplicar) return console.log('\nSimulación: no se borró nada. Agrega --aplicar para borrar.');

  await db.collection('reviews').deleteMany({ $or: [MARCA, { courtId: { $in: ids } }] });
  await db.collection('bookings').deleteMany({ $or: [MARCA, { courtId: { $in: ids } }] });
  await db.collection('blockedslots').deleteMany({ courtId: { $in: ids } });
  await db.collection('listaespera').deleteMany({ courtId: { $in: ids } });
  await db.collection('courts').deleteMany(MARCA);
  await db.collection('clubs').deleteMany(MARCA);
  await db.collection('users').deleteMany(MARCA);
  console.log('\nListo: se borró todo lo de ejemplo.');
}

// ─── Crear ──────────────────────────────────────────────────────────────────

async function sembrar(db) {
  if (!correoBase || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correoBase)) {
    throw new Error('Falta --correo tu@correo.com (los dueños de ejemplo quedan como tu+demo-1@...)');
  }
  const ya = await db.collection('courts').countDocuments(MARCA);
  if (ya > 0) {
    throw new Error(`Ya hay ${ya} canchas de ejemplo. Bórralas primero con --borrar --aplicar.`);
  }

  const ahora = new Date();
  const passwordHash = await bcrypt.hash(clave, 10);
  const plan = { users: [], clubs: [], courts: [], bookings: [], reviews: [] };
  const sufijo = crypto.randomBytes(2).toString('hex');

  for (let i = 0; i < numClubes; i++) {
    const club = CLUBES[i];
    const ciudad = CIUDADES[i % CIUDADES.length];
    const barrio = elegir(ciudad.barrios);
    const ownerId = new mongoose.Types.ObjectId();
    const email = correoDemo(correoBase, i + 1);
    const nombreDueno = `${elegir(NOMBRES)} ${elegir(APELLIDOS)}`;

    plan.users.push({
      _id: ownerId, ...MARCA,
      name: nombreDueno, email, passwordHash, role: 'owner',
      phone: `+57 3${entre(10, 22)} ${entre(100, 999)} ${entre(1000, 9999)}`,
      isActive: true, plan: 'pro', subscriptionEstado: 'activa', debeCambiarClave: false,
      createdAt: ahora, updatedAt: ahora,
    });

    /* Cada club tiene un deporte fuerte y a veces alguno más. */
    const principal = elegir(['futbol', 'futbol', 'padel', 'voley_playa']);
    const deportes = [principal, principal, elegir(['futbol', 'padel', 'voley_playa'])].slice(0, entre(2, 3));
    const fotosClub = [];

    deportes.forEach((sport, k) => {
      const info = CANCHAS[sport];
      const courtId = new mongoose.Types.ObjectId();
      const fotos = mezclar(FOTOS[sport].flatMap((f) => ENCUADRES.map((e) => `${f}?${e}`))).slice(0, entre(2, 4));
      fotosClub.push(fotos[0]);
      const amenidades = mezclar(AMENIDADES).slice(0, entre(3, 6));
      if (!amenidades.includes('Luz nocturna') && azar() > 0.3) amenidades.push('Luz nocturna');
      const precio = elegir(info.precios);

      /* Reseñas: reservas ya jugadas (manuales, sin cobro) con su reseña. */
      const numResenas = entre(3, 9);
      let suma = 0;
      for (let r = 0; r < numResenas; r++) {
        const rating = elegir([5, 5, 5, 4, 4, 4, 3]);
        suma += rating;
        const dias = entre(3, 120);
        const fecha = new Date(ahora.getTime() - dias * 86400000);
        fecha.setUTCHours(5, 0, 0, 0); // medianoche en Colombia
        const hora = entre(7, 21);
        const bookingId = new mongoose.Types.ObjectId();
        const token = crypto.randomUUID();
        const jugador = `${elegir(NOMBRES)} ${elegir(APELLIDOS).charAt(0)}.`;
        plan.bookings.push({
          _id: bookingId, ...MARCA, courtId,
          guestName: jugador, origen: 'manual',
          date: fecha, startTime: `${String(hora).padStart(2, '0')}:00`, endTime: `${String(hora + 1).padStart(2, '0')}:00`,
          players: entre(4, 14), status: 'completed',
          totalPrice: precio, precioCancha: precio, tarifaServicio: 0, costoPasarela: 0, gananciaPlataforma: 0, netoDueno: 0,
          paymentMethod: 'club',
          cancelToken: crypto.randomUUID(), bookingCode: codigoReserva(), reviewToken: token, reviewTokenUsed: true,
          reminderSent: true, reprogramaciones: 0,
          createdAt: fecha, updatedAt: fecha,
        });
        plan.reviews.push({
          ...MARCA, courtId, bookingId, guestName: jugador, rating,
          comment: elegir(COMENTARIOS[rating]), reviewToken: token, isVisible: true,
          createdAt: new Date(fecha.getTime() + 3 * 3600000), updatedAt: new Date(fecha.getTime() + 3 * 3600000),
        });
      }

      /* ~600 m alrededor del centro de la ciudad, para que se vean separadas en el mapa. */
      const lng = ciudad.centro[0] + (azar() - 0.5) * 0.04;
      const lat = ciudad.centro[1] + (azar() - 0.5) * 0.04;
      const nombre = info.nombres[(i + k) % info.nombres.length];

      plan.courts.push({
        _id: courtId, ...MARCA, ownerId,
        name: nombre, description: info.descripcion, sport,
        location: {
          address: `Calle ${entre(10, 99)} # ${entre(1, 60)}-${entre(10, 99)}, ${barrio}`,
          coordinates: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
          city: ciudad.city, department: ciudad.department,
        },
        pricePerHour: precio, currency: 'COP', photos: fotos, availability: horario(),
        isActive: true,
        averageRating: Math.round((suma / numResenas) * 10) / 10, totalReviews: numResenas,
        amenities: amenidades,
        createdAt: ahora, updatedAt: ahora,
      });
    });

    const usuarioIg = slugDe(club.nombre).replace(/-/g, '');
    plan.clubs.push({
      ...MARCA,
      name: club.nombre, slogan: club.slogan, slug: `${slugDe(club.nombre)}-${sufijo}`,
      description: `${club.nombre} es un club en ${barrio}, ${ciudad.city}. ${club.slogan}: canchas en excelente estado, buena iluminación y atención de primera.`,
      address: `${barrio}, ${ciudad.city}`, city: ciudad.city,
      contactEmail: email, contactPhone: plan.users.at(-1).phone,
      ownerUserId: ownerId, photos: fotosClub,
      schedule: 'Lunes a sábado 6:00 a. m. – 11:00 p. m. · Domingos 8:00 a. m. – 8:00 p. m.',
      socialLinks: { instagram: `https://instagram.com/${usuarioIg}` },
      createdAt: ahora, updatedAt: ahora,
    });
  }

  console.log(`Se crearían ${plan.clubs.length} clubes, ${plan.courts.length} canchas, ${plan.reviews.length} reseñas (con sus reservas ya jugadas).\n`);
  for (const c of plan.clubs) {
    const canchas = plan.courts.filter((k) => String(k.ownerId) === String(c.ownerUserId));
    console.log(`  ${c.name} — ${c.city}  (${c.contactEmail})`);
    for (const k of canchas) console.log(`      · ${k.name} [${k.sport}] $${k.pricePerHour.toLocaleString('es-CO')}  ★ ${k.averageRating} (${k.totalReviews})`);
  }

  if (!aplicar) return console.log('\nSimulación: no se escribió nada. Agrega --aplicar para crearlo.');

  const choque = await db.collection('users').countDocuments({ email: { $in: plan.users.map((u) => u.email) } });
  if (choque > 0) throw new Error('Algunos correos de ejemplo ya existen en users. Bórralos o usa otro --correo.');

  await db.collection('users').insertMany(plan.users);
  await db.collection('clubs').insertMany(plan.clubs);
  await db.collection('courts').insertMany(plan.courts);
  await db.collection('bookings').insertMany(plan.bookings);
  await db.collection('reviews').insertMany(plan.reviews);

  console.log('\nListo. Para entrar al panel de cualquier club de ejemplo:');
  console.log(`  correo: ${plan.users[0].email}  (o los demás de la lista)`);
  console.log(`  contraseña: ${clave}`);
  console.log('\nPara quitarlo todo: node scripts/sembrar-demo.js --borrar --aplicar');
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta MONGODB_URI en el .env');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`Base: ${db.databaseName}`);
  console.log(aplicar ? '>> MODO REAL: se van a escribir cambios\n' : '>> SIMULACION: no se escribe nada\n');
  try {
    if (borrar) await borrarTodo(db);
    else await sembrar(db);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(`\nError: ${e.message}`);
  process.exit(1);
});
