// Ruta: src/app/dashboard/propetario/canchas/[id]/editar/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, MapPin, DollarSign, Loader2, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api/axios';

const schema = z.object({
  name:         z.string().min(3, 'Mínimo 3 caracteres'),
  description:  z.string().max(300).optional(),
  address:      z.string().min(5, 'Ingresa la dirección'),
  city:         z.string().min(2, 'Ingresa la ciudad'),
  department:   z.string().min(2, 'Ingresa el departamento'),
  pricePerHour: z.coerce.number().min(1000, 'Precio mínimo $1.000 COP'),
});

type FormValues = z.infer<typeof schema>;

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';
const card = 'bg-white rounded-2xl border border-gray-100 p-6';

const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
      <Icon className="h-3 w-3 text-white" />
    </div>
    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{label}</span>
  </div>
);

export default function EditarCanchaPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params.id as string;

  const { data: court, isLoading } = useQuery({
    queryKey: ['court', id],
    queryFn: async () => { const { data } = await api.get(`/courts/${id}`); return data; },
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Pre-llenar el form cuando lleguen los datos
  useEffect(() => {
    if (court) {
      reset({
        name:         court.name,
        description:  court.description ?? '',
        address:      court.location?.address ?? '',
        city:         court.location?.city ?? '',
        department:   court.location?.department ?? '',
        pricePerHour: court.pricePerHour,
      });
    }
  }, [court, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.patch(`/courts/${id}`, {
      name:        values.name,
      description: values.description,
      location: {
        address:    values.address,
        city:       values.city,
        department: values.department,
      },
      pricePerHour: values.pricePerHour,
    }),
    onSuccess: () => {
      toast.success('¡Cancha actualizada correctamente!');
      router.push('/dashboard/propetario/canchas');
    },
    onError: (e: any) => toast.error(e.message || 'Error al actualizar la cancha'),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 pb-12">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-48" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/propetario/canchas"
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
          <div className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Volver
        </Link>
      </div>

      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Editar cancha
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">
          {court?.name ?? 'Cargando...'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Modifica la información de tu cancha</p>
      </div>

      <form onSubmit={handleSubmit(v => mutation.mutate(v))} className="space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Columna izquierda */}
          <div className="space-y-5">
            <div className={card}>
              <SectionTitle icon={Building2} label="Información básica" />
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Nombre <span className="text-red-500">*</span></label>
                  <input className={inp} placeholder="Ej: Cancha Sintética El Estadio" {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={lbl}>Descripción <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                  <textarea rows={4} className={inp} style={{ resize: 'none' }}
                    placeholder="Superficie, capacidad, características especiales..."
                    {...register('description')} />
                </div>
              </div>
            </div>

            {/* Deporte — solo lectura, no se puede cambiar */}
            {court?.sport && (
              <div className={card}>
                <SectionTitle icon={CheckCircle2} label="Deporte" />
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                  <span className="text-3xl">
                    {court.sport === 'futbol' ? '⚽' : court.sport === 'padel' ? '🎾' : '🏐'}
                  </span>
                  <div>
                    <p className="font-black text-gray-900">
                      {court.sport === 'futbol' ? 'Fútbol' : court.sport === 'padel' ? 'Pádel' : 'Voley Playa'}
                    </p>
                    <p className="text-xs text-gray-400">El deporte no se puede cambiar después de creado</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-5">
            <div className={card}>
              <SectionTitle icon={MapPin} label="Ubicación" />
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Dirección <span className="text-red-500">*</span></label>
                  <input className={inp} placeholder="Ej: Calle 72 #45-23" {...register('address')} />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Ciudad <span className="text-red-500">*</span></label>
                    <input className={inp} placeholder="Villavicencio" {...register('city')} />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Departamento <span className="text-red-500">*</span></label>
                    <input className={inp} placeholder="Meta" {...register('department')} />
                    {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className={card}>
              <SectionTitle icon={DollarSign} label="Precio" />
              <div>
                <label className={lbl}>Precio por hora (COP) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                  <input type="number" min={1000} step={1000}
                    className={inp + " pl-8"} placeholder="80000" {...register('pricePerHour')} />
                </div>
                {errors.pricePerHour && <p className="text-xs text-red-500 mt-1">{errors.pricePerHour.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/dashboard/propetario/canchas')}
            className="flex-1 border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-4 rounded-2xl transition-all"
            disabled={mutation.isPending}>
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-colors shadow-lg">
            {mutation.isPending
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
              : <><Save className="h-5 w-5" /> Guardar cambios</>}
          </button>
        </div>
      </form>
    </div>
  );
}