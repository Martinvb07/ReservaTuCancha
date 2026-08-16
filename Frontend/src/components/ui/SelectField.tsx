'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

/* Desplegable con el estilo del sitio. El de shadcn (components/ui/select.tsx)
   viene con clases de Tailwind 4 y este proyecto usa la 3, por eso va aparte. */

export type SelectOption = { value: string; label: string };

interface Props {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Clases extra del disparador */
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
  /** Color de acento; naranja para las pantallas de bloqueos */
  accent?: 'green' | 'orange';
}

const TRIGGER =
  'group w-full flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 ' +
  'outline-none transition hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed';

const ACCENT = {
  green: {
    ring:  'focus:ring-2 focus:ring-green-400 data-[state=open]:ring-2 data-[state=open]:ring-green-400',
    item:  'data-[highlighted]:bg-green-50 data-[highlighted]:text-green-800 data-[state=checked]:text-green-700',
    check: 'text-green-600',
  },
  orange: {
    ring:  'focus:ring-2 focus:ring-orange-400 data-[state=open]:ring-2 data-[state=open]:ring-orange-400',
    item:  'data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-800 data-[state=checked]:text-orange-700',
    check: 'text-orange-500',
  },
} as const;

export default function SelectField({
  value, onChange, options, placeholder = 'Selecciona…', className = '', disabled,
  accent = 'green', 'aria-label': ariaLabel,
}: Props) {
  const a = ACCENT[accent];
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger className={`${TRIGGER} ${a.ring} ${className}`} aria-label={ariaLabel}>
        <span className="min-w-0 truncate text-left">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          {/* el data-state vive en el trigger, por eso el group- */}
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[60] min-w-[var(--radix-select-trigger-width)] max-h-[min(17rem,var(--radix-select-content-available-height))]
                     overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-900/10
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
                     data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center bg-white py-1 text-gray-400">
            <ChevronUp className="h-4 w-4" />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1.5">
            {options.map(o => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className={`relative flex cursor-pointer select-none items-center rounded-xl py-2.5 pl-3 pr-9 text-sm text-gray-700 outline-none
                           transition-colors data-[state=checked]:font-bold ${a.item}`}
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3">
                  <Check className={`h-4 w-4 ${a.check}`} strokeWidth={3} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center bg-white py-1 text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
