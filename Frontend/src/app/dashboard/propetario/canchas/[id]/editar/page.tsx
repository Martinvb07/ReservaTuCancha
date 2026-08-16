// Ruta: src/app/dashboard/propetario/canchas/[id]/editar/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, MapPin, DollarSign, Clock, Loader2, Save } from 'lucide-react';
import { getSportIcon } from '@/components/ui/SportIcons';
import SettingsTabs, { type SettingsSection } from '@/components/ui/SettingsTabs';
import AvailabilityEditor, { type AvailabilitySlot } from '@/components/dashboard/AvailabilityEditor';
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

/* Qué campos vive en cada sección: sirve para marcar errores y para saltar
   a la sección correcta cuando falla el guardado. */
const SECTION_FIELDS: Record<string, (keyof FormValues)[]> = {
  info:          ['name', 'description'],
  ubicacion:     ['address', 'city', 'department'],
  precio:        ['pricePerHour'],
  disponibilidad: [],
};

export default function EditarCanchaPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params.id as string;

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [section, setSection]           = useState('info');

  const { data: court, isLoading } = useQuery({
    queryKey: ['court', id],
    queryFn: async () => { const { data } = await api.get(`/courts/${id}`); return data; },
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
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
      if (court.availability && Array.isArray(court.availability)) {
        setAvailability(court.availability);
      }
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
      availability,
    }),
    onSuccess: () => {
      toast.success('¡Cancha actualizada correctamente!');
      router.push('/dashboard/propetario/canchas');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message || 'Error al actualizar la cancha'),
  });

  /* Si el guardado falla, abrimos la sección que tiene el error */
  const onInvalid = () => {
    const bad = Object.keys(SECTION_FIELDS).find(k => SECTION_FIELDS[k].some(f => errors[f]));
    if (bad) setSection(bad);
    toast.error('Revisa los campos marcados en rojo.');
  };

  const SECTIONS: SettingsSection[] = [
    { id: 'info',           title: 'Información',    hint: 'Nombre y descripción de la cancha',   icon: Building2,   alert: SECTION_FIELDS.info.some(f => errors[f]) },
    { id: 'ubicacion',      title: 'Ubicación',      hint: 'Dónde queda la cancha',               icon: MapPin,      alert: SECTION_FIELDS.ubicacion.some(f => errors[f]) },
    { id: 'precio',         title: 'Precio',         hint: 'Tarifa por hora de juego',            icon: DollarSign,  alert: SECTION_FIELDS.precio.some(f => errors[f]) },
    { id: 'disponibilidad', title: 'Disponibilidad', hint: 'Días y horarios en los que atiendes', icon: Clock },
  ];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 pb-12">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-5">
          <div className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const SportIcon = getSportIcon(court?.sport);
  const sportLabel = court?.sport === 'futbol' ? 'Fútbol' : court?.sport === 'padel' ? 'Pádel' : 'Voley Playa';

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/propetario/canchas"
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group">
          <span className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-gray-400 flex items-center justify-center transition-all">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </span>
          Volver
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Editar cancha
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">{court?.name ?? '—'}</h1>
          <p className="text-gray-500 text-sm mt-1">Elige qué quieres modificar</p>
        </div>

        {/* El deporte no se puede cambiar: se muestra como dato fijo */}
        {court?.sport && (
          <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl px-4 py-2.5">
            <SportIcon className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">{sportLabel}</p>
              <p className="text-[11px] text-gray-400">No se puede cambiar</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(v => mutation.mutate(v), onInvalid)} className="space-y-5">
        <SettingsTabs id="editar-cancha" sections={SECTIONS} active={section} onChange={setSection}>

          {section === 'info' && (
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
          )}

          {section === 'ubicacion' && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Dirección <span className="text-red-500">*</span></label>
                <input className={inp} placeholder="Ej: Calle 72 #45-23" {...register('address')} />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          )}

          {section === 'precio' && (
            <div className="max-w-xs">
              <label className={lbl}>Precio por hora (COP) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                <input type="number" min={1000} step={1000}
                  className={inp + ' pl-8'} placeholder="80000" {...register('pricePerHour')} />
              </div>
              {errors.pricePerHour && <p className="text-xs text-red-500 mt-1">{errors.pricePerHour.message}</p>}
            </div>
          )}

          {section === 'disponibilidad' && (
            <AvailabilityEditor value={availability} onChange={setAvailability} />
          )}
        </SettingsTabs>

        {/* Botones: fijos abajo para no perderlos al cambiar de sección */}
        <div className="sticky bottom-0 -mx-4 md:mx-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-6 pb-4 px-4 md:px-0">
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/dashboard/propetario/canchas')}
              className="flex-1 sm:flex-none sm:px-8 bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-4 rounded-2xl transition-all"
              disabled={mutation.isPending}>
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20">
              {mutation.isPending
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
                : <><Save className="h-5 w-5" /> Guardar cambios</>}
            </button>
          </div>
          {isDirty && (
            <p className="text-xs text-gray-400 text-center mt-2">Tienes cambios sin guardar</p>
          )}
        </div>
      </form>
    </div>
  );
}
