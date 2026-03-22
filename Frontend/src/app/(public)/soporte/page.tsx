'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail, Phone, MessageSquare, Clock, ChevronRight,
  CheckCircle, HelpCircle, BookOpen, Zap, Users,
} from 'lucide-react';

const CANALES = [
  {
    icon: MessageSquare,
    title: 'Chat en vivo',
    desc: 'Respuesta en menos de 5 minutos durante horario hábil.',
    cta: 'Iniciar chat',
    href: '#chat',
    badge: 'Más rápido',
    badgeColor: 'bg-green-100 text-green-700',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    available: true,
  },
  {
    icon: Mail,
    title: 'Email de soporte',
    desc: 'Escríbenos a soporte@reservatucancha.co y respondemos en 24h.',
    cta: 'Enviar email',
    href: 'mailto:soporte@reservatucancha.co',
    badge: '',
    badgeColor: '',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    available: true,
  },
  {
    icon: Phone,
    title: 'WhatsApp',
    desc: 'Escríbenos por WhatsApp para una atención personalizada.',
    cta: 'Abrir WhatsApp',
    href: 'https://wa.me/573001234567',
    badge: '',
    badgeColor: '',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    available: true,
  },
];

const CATEGORIAS = [
  { icon: Zap,          label: 'Primeros pasos',      desc: 'Cómo registrar tu cancha y recibir tu primera reserva.' },
  { icon: BookOpen,     label: 'Gestión de reservas', desc: 'Confirmar, cancelar y reembolsar reservas.' },
  { icon: CheckCircle,  label: 'Pagos y facturación', desc: 'Métodos de pago, retiros y facturas.' },
  { icon: Users,        label: 'Cuenta y perfil',     desc: 'Configurar tu cuenta, logo y datos de contacto.' },
];

const FAQ_SOPORTE = [
  {
    cat: 'Reservas',
    items: [
      { q: '¿Cómo confirmo una reserva manualmente?', a: 'Desde tu panel → Reservas → busca la reserva → haz click en "Confirmar". El cliente recibe un email automáticamente.' },
      { q: '¿Puedo bloquear horarios en mi cancha?', a: 'Sí. En tu panel → Mis Canchas → Disponibilidad, puedes marcar cualquier horario como no disponible por mantenimiento o uso propio.' },
      { q: '¿Qué pasa si un cliente no llega?', a: 'La reserva queda como "Completada" al vencer el horario. Puedes marcarla como "No show" desde el panel para llevar tu historial.' },
    ],
  },
  {
    cat: 'Pagos',
    items: [
      { q: '¿Cuándo recibo el dinero de las reservas?', a: 'Los pagos se acreditan en tu cuenta bancaria entre 1 y 3 días hábiles después de confirmada la reserva.' },
      { q: '¿Cómo configuro los métodos de pago?', a: 'En tu panel → Configuración → Pagos. Conectamos tu cuenta de Stripe o Wompi en menos de 5 minutos.' },
      { q: '¿Se emiten facturas electrónicas?', a: 'Sí. En el plan Pro generamos factura electrónica automática por cada reserva y la enviamos al cliente.' },
    ],
  },
  {
    cat: 'Cuenta',
    items: [
      { q: '¿Cómo agrego más canchas a mi perfil?', a: 'Panel → Mis Canchas → "Agregar cancha". Puedes tener canchas ilimitadas en el plan Pro.' },
      { q: '¿Puedo tener varios usuarios administrando?', a: 'En el plan Empresarial puedes agregar sub-usuarios con permisos personalizados. Contáctanos para configurarlo.' },
      { q: '¿Cómo cambio mi contraseña?', a: 'Panel → Perfil → Seguridad → "Cambiar contraseña". También puedes usar el link de "Olvidé mi contraseña" en el login.' },
    ],
  },
];

export default function SoportePage() {
  const [openCat, setOpenCat]   = useState<string>('Reservas');
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [form, setForm]         = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [sent, setSent]         = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const activeFaqs = FAQ_SOPORTE.find(c => c.cat === openCat)?.items ?? [];

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center text-white space-y-5">
          <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <span>✦</span> Centro de soporte
          </p>
          <h1 className="text-5xl font-black uppercase leading-tight">
            ¿En qué podemos <span className="text-lime-400">ayudarte?</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            Nuestro equipo está disponible para ayudarte con cualquier duda sobre ReservaTuCancha.
          </p>
          {/* Buscador decorativo */}
          <div className="max-w-lg mx-auto mt-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3.5">
              <HelpCircle className="h-5 w-5 text-gray-400 shrink-0" />
              <span className="text-gray-400 text-sm">Busca tu pregunta aquí...</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CANALES DE CONTACTO ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
            <span>✦</span> Contacto
          </p>
          <h2 className="text-4xl font-black text-gray-900 uppercase">Elige cómo contactarnos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CANALES.map((canal) => (
            <div key={canal.title} className="relative border border-gray-100 rounded-2xl p-7 hover:shadow-lg hover:border-green-200 transition-all group">
              {canal.badge && (
                <span className={`absolute top-5 right-5 text-xs font-bold px-3 py-1 rounded-full ${canal.badgeColor}`}>
                  {canal.badge}
                </span>
              )}
              <div className={`w-12 h-12 ${canal.color} rounded-xl flex items-center justify-center mb-5`}>
                <canal.icon className={`h-6 w-6 ${canal.iconColor}`} />
              </div>
              <h3 className="font-black text-gray-900 text-lg mb-2">{canal.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{canal.desc}</p>
              <a
                href={canal.href}
                className="inline-flex items-center gap-2 text-sm font-bold text-green-700 hover:text-green-800 transition-colors"
              >
                {canal.cta} <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>

        {/* Horario */}
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-2xl py-4 px-6">
          <Clock className="h-4 w-4 text-green-600" />
          <span>Horario de atención: <strong className="text-gray-700">Lunes a viernes 8am – 7pm</strong> · Sábados <strong className="text-gray-700">9am – 2pm</strong> · Colombia (UTC-5)</span>
        </div>
      </section>

      {/* ── CATEGORÍAS FAQ ────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
              <span>✦</span> Base de conocimiento
            </p>
            <h2 className="text-4xl font-black text-gray-900 uppercase">Preguntas frecuentes</h2>
          </div>

          {/* Tabs de categorías */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {FAQ_SOPORTE.map((cat) => (
              <button
                key={cat.cat}
                onClick={() => { setOpenCat(cat.cat); setOpenFaq(null); }}
                className={`px-5 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                  openCat === cat.cat
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-green-300 bg-white'
                }`}
              >
                {cat.cat}
              </button>
            ))}
          </div>

          {/* FAQs */}
          <div className="space-y-3">
            {activeFaqs.map((item, i) => (
              <button
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left bg-white border border-gray-100 rounded-2xl p-5 hover:border-green-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-gray-800">{item.q}</span>
                  <ChevronRight className={`h-5 w-5 text-gray-400 shrink-0 mt-0.5 transition-transform duration-200 ${openFaq === i ? 'rotate-90 text-green-500' : ''}`} />
                </div>
                {openFaq === i && (
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULARIO DE CONTACTO ────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
            <span>✦</span> Escríbenos
          </p>
          <h2 className="text-4xl font-black text-gray-900 uppercase">Envíanos un mensaje</h2>
          <p className="text-gray-500 mt-3">Te respondemos en menos de 24 horas hábiles.</p>
        </div>

        {sent ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900">¡Mensaje enviado!</h3>
            <p className="text-gray-500">Te responderemos a <strong>{form.email}</strong> en las próximas 24 horas.</p>
            <button
              onClick={() => { setSent(false); setForm({ nombre: '', email: '', asunto: '', mensaje: '' }); }}
              className="text-sm text-green-600 font-semibold hover:underline mt-4"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 rounded-3xl p-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@email.com"
                  className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Asunto</label>
              <select
                value={form.asunto}
                onChange={e => setForm({ ...form, asunto: e.target.value })}
                required
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition text-gray-700"
              >
                <option value="">Selecciona un asunto</option>
                <option value="reservas">Problemas con reservas</option>
                <option value="pagos">Pagos y facturación</option>
                <option value="cuenta">Mi cuenta</option>
                <option value="tecnico">Problema técnico</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Mensaje</label>
              <textarea
                required
                rows={5}
                value={form.mensaje}
                onChange={e => setForm({ ...form, mensaje: e.target.value })}
                placeholder="Cuéntanos tu problema con el mayor detalle posible..."
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Enviar mensaje
            </button>
          </form>
        )}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white space-y-5">
          <h2 className="text-3xl font-black uppercase">¿Aún no tienes cuenta?</h2>
          <p className="text-gray-400">Solicita acceso y empieza a recibir reservas hoy mismo.</p>
          <Link
            href="/solicitar-acceso"
            className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            Solicitar acceso gratis <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

    </main>
  );
}