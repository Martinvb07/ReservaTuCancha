// src/app/(public)/resena/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle, XCircle, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api/axios';

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-2">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`h-10 w-10 transition-colors ${
            i <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
          }`} />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Muy mala 😞',
  2: 'Regular 😐',
  3: 'Buena 🙂',
  4: 'Muy buena 😊',
  5: '¡Excelente! 🤩',
};

function ResenaContent() {
  const params = useSearchParams();
  const token  = params.get('token');
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent]       = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/reviews', { reviewToken: token, rating, comment });
      return data;
    },
    onSuccess: () => setSent(true),
  });

  if (!token) {
    return (
      <div className="text-center space-y-4 py-20">
        <XCircle className="h-16 w-16 text-red-400 mx-auto" />
        <h2 className="text-2xl font-black text-white uppercase">Link inválido</h2>
        <p className="text-gray-400">Este link de reseña no es válido o ya fue usado.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="text-center space-y-6 py-10 max-w-md mx-auto">
        <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-lime-400/30">
          <CheckCircle className="h-10 w-10 text-gray-900" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase">¡Gracias!</h2>
          <p className="text-gray-400 mt-2">Tu reseña fue enviada. Ayuda a otros jugadores a encontrar las mejores canchas.</p>
        </div>
        <div className="flex justify-center gap-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className={`h-8 w-8 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
          ))}
        </div>
        <Link href="/empresas" className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full transition-colors">
          Buscar más canchas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-6">
      <div className="text-center space-y-2">
        <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest">✦ Tu opinión importa</p>
        <h2 className="text-3xl font-black text-white uppercase">¿Cómo estuvo la cancha?</h2>
        <p className="text-gray-400 text-sm">Tu reseña ayuda a otros jugadores a elegir mejor</p>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gray-900 px-6 py-5 text-center">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Califica tu experiencia</p>
          <div className="flex justify-center">
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
          {rating > 0 && (
            <p className="text-lime-400 font-black mt-2 text-lg">{RATING_LABELS[rating]}</p>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Comentario <span className="text-gray-400 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="¿Cómo fue la cancha? ¿Las instalaciones, la atención, la puntualidad...?"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/300</p>
          </div>

          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
              Este link ya fue usado o expiró. Solo puedes dejar una reseña por reserva.
            </div>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={rating === 0 || mutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-colors shadow-lg"
          >
            {mutation.isPending
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</>
              : <><Send className="h-5 w-5" /> Enviar reseña</>}
          </button>

          {rating === 0 && (
            <p className="text-xs text-center text-amber-500">👆 Selecciona una calificación para continuar</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResenaPage() {
  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gray-700 border-t-lime-400 rounded-full animate-spin" /></div>}>
          <ResenaContent />
        </Suspense>
      </div>
    </main>
  );
}