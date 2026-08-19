'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Mail, Phone, ChevronDown, CalendarDays, CreditCard,
  RefreshCw, Star, ArrowRight,
} from 'lucide-react';
import { ABRIR_SOPORTE } from '@/components/layout/SupportChat';

const WHATSAPP = 'https://wa.me/573124352786';
const EMAIL    = 'soporte@reservatucancha.site';

/* Esta página es el soporte de quien RESERVA. Lo de administrar canchas,
   liquidaciones y cobros vive en /que-ofrecemos y en el panel del club: acá
   solo confundía, porque el 99% de quien entra es un jugador. */

const CANALES = [
  {
    icon: MessageSquare,
    title: 'Asistente virtual',
    desc: 'Te responde al instante las dudas más comunes y te pasa a un humano si hace falta.',
    cta: 'Abrir asistente',
    badge: 'Más rápido',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    icon: Phone,
    title: 'WhatsApp',
    desc: 'Si tu caso necesita revisión, escríbenos y te atendemos personalmente.',
    cta: 'Abrir WhatsApp',
    href: WHATSAPP,
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Mail,
    title: 'Correo',
    desc: `Escríbenos a ${EMAIL} y te respondemos dentro de las 24 horas.`,
    cta: 'Enviar correo',
    href: `mailto:${EMAIL}`,
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
];

const FAQ = [
  {
    cat: 'Reservar',
    icon: CalendarDays,
    items: [
      { q: '¿Necesito crear una cuenta?', a: 'No. Eliges la cancha, el día y la hora, y solo pones tu nombre, correo y teléfono. Sin contraseñas ni registro.' },
      { q: '¿Cómo sé que mi reserva quedó lista?', a: 'Apenas se aprueba el pago te llega un correo con el código de tu reserva. Si no lo ves, revisa la carpeta de spam: llega desde notificaciones@reservatucancha.site.' },
      { q: '¿Dónde veo mis reservas?', a: 'En "Mis reservas", arriba en el menú. Con el correo que usaste al reservar te aparecen todas.' },
      { q: '¿Puedo reservar varias horas seguidas?', a: 'Sí. Al elegir la hora puedes marcar varios turnos seguidos y se cobran juntos como una sola reserva.' },
    ],
  },
  {
    cat: 'Pagos',
    icon: CreditCard,
    items: [
      { q: '¿Cómo puedo pagar?', a: 'Con tarjeta de crédito o débito, PSE, Nequi o Daviplata. El pago se procesa con Wompi, la pasarela de Bancolombia.' },
      { q: '¿Puedo pagar en efectivo en la cancha?', a: 'No. Todas las reservas se pagan en línea al momento de reservar; así el horario te queda apartado de verdad y nadie más lo puede tomar.' },
      { q: '¿A nombre de quién aparece el cobro?', a: 'Aparece como ReservaTuCancha, no como el club. Nosotros recibimos el pago y le transferimos al club lo que le corresponde.' },
      { q: 'Me cobraron pero no me llegó la confirmación', a: 'Espera unos minutos y revisa spam. Si sigue sin llegar, escríbenos por WhatsApp con el número de tu transacción y lo revisamos de inmediato.' },
    ],
  },
  {
    cat: 'Cambios',
    icon: RefreshCw,
    items: [
      { q: '¿Puedo cambiar el horario de mi reserva?', a: 'Sí. En el correo de confirmación tienes el botón "Cambiar mi horario": eliges otro día y hora entre los turnos libres del club, sin costo adicional.' },
      { q: '¿Hasta cuándo puedo cambiarlo?', a: 'Hasta 24 horas antes de tu turno. Después de ese momento el club ya no alcanza a revender el horario, así que el cambio se cierra.' },
      { q: '¿Puedo cancelar y que me devuelvan el dinero?', a: 'No manejamos devoluciones. Si no puedes ir, mueve tu reserva a otro día u hora: el valor que ya pagaste se conserva completo.' },
      { q: '¿Y si me pasé del plazo?', a: 'Escríbenos por WhatsApp y hablamos con el club para ver qué se puede hacer. No lo prometemos, pero siempre lo intentamos.' },
    ],
  },
  {
    cat: 'Canchas',
    icon: Star,
    items: [
      { q: '¿Ustedes son dueños de las canchas?', a: 'No. Cada cancha pertenece a un club independiente que la administra y la opera. Nosotros somos la plataforma que te conecta con ellos y maneja la reserva y el pago.' },
      { q: '¿Cómo llego a la cancha?', a: 'En la página de cada cancha hay un mapa con su ubicación y un botón "Cómo llegar" que te abre la ruta en Google Maps.' },
      { q: '¿Puedo dejar una reseña?', a: 'Sí, y solo puede hacerlo quien reservó de verdad. Después de jugar te llega un correo con el enlace para calificar la cancha.' },
      { q: 'Llegué y la cancha estaba ocupada', a: 'Escríbenos por WhatsApp con tu código de reserva. Hablamos con el club y te ayudamos a resolverlo.' },
    ],
  },
];

export default function SoportePage() {
  const [cat, setCat] = useState(FAQ[0].cat);
  const [abierta, setAbierta] = useState<string | null>(null);

  const activas = FAQ.find((c) => c.cat === cat)?.items ?? [];

  const abrirAsistente = () => window.dispatchEvent(new CustomEvent(ABRIR_SOPORTE));

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-lime-400 rounded-full translate-x-1/3 -translate-y-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-14 md:py-20 text-center">
          <p className="text-lime-400 font-semibold text-xs md:text-sm uppercase tracking-widest mb-3">Soporte</p>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase leading-tight">
            ¿En qué te ayudamos?
          </h1>
          <p className="text-gray-300 mt-4 text-sm md:text-base max-w-xl mx-auto">
            Resuelve tu duda acá mismo o escríbenos. Si es sobre una reserva, ten a mano tu código.
          </p>
        </div>
      </section>

      {/* ── CANALES ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {CANALES.map((c) => {
            const contenido = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className={`w-12 h-12 rounded-2xl grid place-items-center shrink-0 ${c.color}`}>
                    <c.icon className={`h-5 w-5 ${c.iconColor}`} />
                  </span>
                  {c.badge && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {c.badge}
                    </span>
                  )}
                </div>
                <h2 className="font-black text-gray-900 mt-4">{c.title}</h2>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed flex-1">{c.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 mt-4 group-hover:gap-2.5 transition-all">
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </>
            );

            const clases = 'group flex flex-col text-left h-full bg-white border border-gray-200 rounded-2xl p-5 md:p-6 hover:border-green-400 hover:shadow-lg transition-all';

            return c.href ? (
              <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer" className={clases}>
                {contenido}
              </a>
            ) : (
              <button key={c.title} type="button" onClick={abrirAsistente} className={clases}>
                {contenido}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── PREGUNTAS FRECUENTES ─────────────────────────────── */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase text-center">Preguntas frecuentes</h2>

          {/* Categorías: en móvil se deslizan en horizontal */}
          <div className="flex gap-2 overflow-x-auto mt-6 md:mt-8 pb-2 md:justify-center -mx-4 px-4 md:mx-0 md:px-0">
            {FAQ.map((c) => {
              const activa = cat === c.cat;
              return (
                <button key={c.cat} type="button"
                  onClick={() => { setCat(c.cat); setAbierta(null); }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap border-2 transition-all ${
                    activa ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-green-400'
                  }`}>
                  <c.icon className="h-4 w-4" /> {c.cat}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2.5">
            {activas.map((f) => {
              const abierto = abierta === f.q;
              return (
                <div key={f.q} className={`bg-white border rounded-2xl overflow-hidden transition-colors ${abierto ? 'border-green-400' : 'border-gray-200'}`}>
                  <button type="button"
                    onClick={() => setAbierta(abierto ? null : f.q)}
                    aria-expanded={abierto}
                    className="w-full flex items-center justify-between gap-4 text-left p-4 md:p-5">
                    <span className="font-bold text-gray-900 text-sm md:text-[15px]">{f.q}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                  </button>
                  {abierto && (
                    <p className="px-4 md:px-5 pb-4 md:pb-5 -mt-1 text-sm text-gray-600 leading-relaxed">{f.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CIERRE ───────────────────────────────────────────── */}
      <section className="bg-gray-900 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase">¿No encontraste tu respuesta?</h2>
          <p className="text-gray-400 mt-3 text-sm md:text-base">
            Escríbenos por WhatsApp con tu código de reserva y lo revisamos contigo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-black px-7 py-3.5 rounded-full transition-colors">
              <Phone className="h-5 w-5" /> Escribir por WhatsApp
            </a>
            <button type="button" onClick={abrirAsistente}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 font-bold px-7 py-3.5 rounded-full transition-colors">
              <MessageSquare className="h-5 w-5" /> Probar el asistente
            </button>
          </div>

          {/* Los clubes tienen su propio camino: acá solo estorbaba. */}
          <p className="text-gray-500 text-xs mt-8">
            ¿Tienes una cancha y quieres publicarla?{' '}
            <Link href="/que-ofrecemos" className="text-gray-300 underline hover:text-white">
              Mira cómo funciona para clubes
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
