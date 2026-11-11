'use client';

import { useState } from 'react';
import { MessageSquare, Mail, Clock, ChevronRight, CheckCircle, Send, Loader2 } from 'lucide-react';
import FaqAccordion from '@/components/ui/FaqAccordion';
import SelectField from '@/components/ui/SelectField';
import { toast } from 'sonner';

const FAQ = [
  { q: '¿Cómo activo o desactivo una cancha?', a: 'Ve a Mis Canchas → selecciona la cancha → usa el interruptor de "Estado" para activarla o desactivarla. Los clientes no podrán reservar canchas inactivas.' },
  { q: '¿Cuándo recibo el dinero de mis reservas?', a: 'Al instante. Cuando el pago se aprueba, ePayco te consigna tu parte directo a tu cuenta, ya con los costos descontados. Puedes ver el detalle de cada reserva en la sección Pagos.' },
  { q: '¿Qué pasa si un cliente no puede ir?', a: 'Las reservas no se reembolsan: el cliente puede mover su reserva a otro horario disponible hasta 24 horas antes del turno, y tu parte se conserva. Si eres tú quien no puede atender un turno ya pagado, escríbenos a soporte: en ese caso se le devuelve el total al cliente y se descuenta tu parte de esa reserva.' },
  { q: '¿Puedo bloquear horarios para mantenimiento?', a: 'Sí. Ve a Disponibilidad → selecciona la cancha → elige el día y horario → márcalo como "No disponible".' },
  { q: '¿Cómo cambio el precio de mi cancha?', a: 'Ve a Mis Canchas → selecciona la cancha → "Editar" → cambia el precio por hora. El cambio aplica para nuevas reservas, no afecta las ya confirmadas.' },
];

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

export default function OwnerSoportePage() {
  const [form, setForm]       = useState({ asunto: '', mensaje: '' });
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asunto) { toast.error('Elige un asunto'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          Panel Propietario
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Soporte</h1>
        <p className="text-gray-500 text-sm mt-1">Estamos aquí para ayudarte con cualquier duda</p>
      </div>

      {/* Canales de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: MessageSquare, title: 'Chat en vivo',      desc: 'Respuesta en menos de 5 min', cta: 'Iniciar chat',   color: 'bg-green-50',  iconColor: 'text-green-600',  badge: 'Más rápido' },
          { icon: Mail,         title: 'Email',              desc: 'Respondemos en 24 horas',      cta: 'Enviar email',  color: 'bg-blue-50',   iconColor: 'text-blue-600',   badge: '' },
        ].map(c => (
          <div key={c.title} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow relative">
            {c.badge && (
              <span className="absolute top-4 right-4 text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {c.badge}
              </span>
            )}
            <div className={`w-11 h-11 ${c.color} rounded-xl flex items-center justify-center mb-4`}>
              <c.icon className={`h-5 w-5 ${c.iconColor}`} />
            </div>
            <h3 className="font-black text-gray-900 mb-1">{c.title}</h3>
            <p className="text-xs text-gray-500 mb-4">{c.desc}</p>
            <button className="flex items-center gap-1.5 text-sm font-bold text-green-700 hover:text-green-800 transition-colors">
              {c.cta} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Horario */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-3.5 text-sm text-gray-500">
        <Clock className="h-4 w-4 text-green-600 shrink-0" />
        <span>Atención: <strong className="text-gray-700">Lun–Vie 8am–7pm</strong> · Sáb <strong className="text-gray-700">9am–2pm</strong> · Colombia (UTC-5)</span>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-gray-900 tracking-widest">Preguntas frecuentes</h2>
        <FaqAccordion
          items={FAQ}
          questionClassName="font-bold text-gray-800 text-sm"
          iconClassName="h-4 w-4"
        />
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-black text-gray-900 tracking-widest">Envíanos un mensaje</h2>

        {sent ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-black text-gray-900">¡Mensaje enviado!</p>
            <p className="text-sm text-gray-500">Te respondemos en las próximas 24 horas hábiles.</p>
            <button
              onClick={() => { setSent(false); setForm({ asunto: '', mensaje: '' }); }}
              className="text-sm text-green-600 font-semibold hover:underline"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={lbl}>Asunto</label>
              <SelectField
                aria-label="Asunto"
                value={form.asunto || undefined}
                onChange={v => setForm({ ...form, asunto: v })}
                placeholder="Selecciona un asunto"
                options={[
                  { value: 'reservas', label: 'Problema con reservas' },
                  { value: 'pagos',    label: 'Pagos y retiros' },
                  { value: 'canchas',  label: 'Gestión de canchas' },
                  { value: 'tecnico',  label: 'Problema técnico' },
                  { value: 'otro',     label: 'Otro' },
                ]}
              />
            </div>
            <div>
              <label className={lbl}>Mensaje</label>
              <textarea
                rows={4}
                required
                value={form.mensaje}
                onChange={e => setForm({ ...form, mensaje: e.target.value })}
                placeholder="Describe tu problema con el mayor detalle posible..."
                className={inp}
                style={{ resize: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl transition-colors"
            >
              {loading
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</>
                : <><Send className="h-4 w-4" /> Enviar mensaje</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}