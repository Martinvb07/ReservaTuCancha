'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' };

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = (hovered || value) > i;
        return (
          <Star
            key={i}
            className={`${sizes[size]} transition-colors duration-100 ${
              filled ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground'
            } ${!readonly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onMouseEnter={() => !readonly && setHovered(i + 1)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(i + 1)}
          />
        );
      })}
    </div>
  );
}
