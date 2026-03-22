import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Review } from '@/types/user.types';

interface ReviewCardProps { review: Review; }

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 transition-all p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            {review.guestName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm">{review.guestName}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: es })}
            </p>
          </div>
        </div>

        {/* Estrellas */}
        <div className="flex items-center gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} />
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed pl-12 border-l-2 border-green-100">
          {review.comment}
        </p>
      )}
    </div>
  );
}