// Ruta: src/app/dashboard/propetario/mi-club/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, MapPin, Phone, Share2, Image as ImageIcon,
  Upload, Trash2, Save, Loader2, Camera, Link2,
  Instagram, Facebook, Music2, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import SettingsTabs, { type SettingsSection } from '@/components/ui/SettingsTabs';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: formData,
  });
  if (!res.ok) throw new Error('Error subiendo imagen');
  return (await res.json()).secure_url as string;
}

/* Link opcional: o está vacío, o es una URL válida */
const optionalUrl = (msg: string) =>
  z.string().trim().refine(v => v === '' || /^https?:\/\/[^\s.]+\.[^\s]+$/.test(v), msg);

const schema = z.object({
  name:         z.string().trim().min(3, 'Mínimo 3 caracteres'),
  slogan:       z.string().trim().max(120, 'Máximo 120 caracteres'),
  description:  z.string().trim().max(600, 'Máximo 600 caracteres'),
  address:      z.string().trim(),
  city:         z.string().trim(),
  contactPhone: z.string().trim(),
  contactEmail: z.string().trim()
    .refine(v => v === '' || z.string().email().safeParse(v).success, 'Email inválido'),
  schedule:     z.string().trim(),
  instagram:    optionalUrl('Debe ser un link completo (https://...)'),
  facebook:     optionalUrl('Debe ser un link completo (https://...)'),
  tiktok:       optionalUrl('Debe ser un link completo (https://...)'),
  /* WhatsApp acepta número suelto: se normaliza a wa.me al guardar */
  whatsapp:     z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: '', slogan: '', description: '', address: '', city: '',
  contactPhone: '', contactEmail: '', schedule: '',
  instagram: '', facebook: '', tiktok: '', whatsapp: '',
};

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';
/* Igual que lbl, pero en fila para acompañar el label con un icono */
const lblIcon = 'flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

/* Qué campos vive en cada sección: sirve para marcar errores y para saltar
   a la sección correcta cuando falla el guardado. */
const SECTION_FIELDS: Record<string, (keyof FormValues)[]> = {
  info:      ['name', 'slogan', 'description'],
  ubicacion: ['address', 'city'],
  contacto:  ['contactPhone', 'contactEmail', 'schedule'],
  logo:      [],
  redes:     ['instagram', 'facebook', 'tiktok', 'whatsapp'],
  fotos:     [],
};

/* Un número suelto se convierte en link de WhatsApp */
function normalizeWhatsapp(value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const digits = v.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

export default function MiClubPage() {
  useApiAuth();
  const queryClient   = useQueryClient();
  const logoInputRef  = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const [section, setSection]   = useState('info');
  const [logoUrl, setLogoUrl]   = useState('');
  const [savedLogo, setSavedLogo] = useState('');
  const [uploadingLogo, setUploadingLogo]     = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const { data: club, isLoading } = useQuery<any>({
    queryKey: ['my-club-profile'],
    queryFn: async () => {
      const { data } = await api.get('/clubs/my-club');
      return data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!club) return;
    reset({
      name:         club.name || '',
      slogan:       club.slogan || '',
      description:  club.description || '',
      address:      club.address || '',
      city:         club.city || '',
      contactPhone: club.contactPhone || '',
      contactEmail: club.contactEmail || '',
      schedule:     club.schedule || '',
      instagram:    club.socialLinks?.instagram || '',
      facebook:     club.socialLinks?.facebook || '',
      tiktok:       club.socialLinks?.tiktok || '',
      whatsapp:     club.socialLinks?.whatsapp || '',
    });
    setLogoUrl(club.logo || '');
    setSavedLogo(club.logo || '');
  }, [club, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { instagram, facebook, tiktok, whatsapp, ...rest } = values;
      await api.patch('/clubs/my-club/profile', {
        ...rest,
        logo: logoUrl,
        socialLinks: { instagram, facebook, tiktok, whatsapp: normalizeWhatsapp(whatsapp) },
      });
    },
    onSuccess: (_d, values) => {
      toast.success('Perfil actualizado');
      reset({ ...values, whatsapp: normalizeWhatsapp(values.whatsapp) });
      setSavedLogo(logoUrl);
      queryClient.invalidateQueries({ queryKey: ['my-club-profile'] });
      queryClient.invalidateQueries({ queryKey: ['club-info'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error guardando perfil'),
  });

  const addPhotoMutation = useMutation({
    mutationFn: (url: string) => api.post('/clubs/my-club/photos', { url }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-club-profile'] }),
  });

  const removePhotoMutation = useMutation({
    mutationFn: (url: string) => api.delete('/clubs/my-club/photos', { data: { url } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-club-profile'] }),
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadToCloudinary(file);
      setLogoUrl(url);
      toast.success('Logo subido — recuerda guardar');
    } catch { toast.error('Error subiendo logo'); }
    setUploadingLogo(false);
    e.target.value = '';
  }

  async function handlePhotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploadingPhotos(true);
    let count = 0;
    for (const file of Array.from(files).slice(0, 10)) {
      try {
        const url = await uploadToCloudinary(file);
        await addPhotoMutation.mutateAsync(url);
        count++;
      } catch { toast.error(`Error con ${file.name}`); }
    }
    setUploadingPhotos(false);
    e.target.value = '';
    if (count) toast.success(`${count} foto${count > 1 ? 's' : ''} subida${count > 1 ? 's' : ''}`);
  }

  /* Si el guardado falla, abrimos la sección que tiene el error */
  const onInvalid = () => {
    const bad = Object.keys(SECTION_FIELDS).find(k => SECTION_FIELDS[k].some(f => errors[f]));
    if (bad) setSection(bad);
    toast.error('Revisa los campos marcados en rojo.');
  };

  function handleDiscard() {
    if (club) {
      reset();
      setLogoUrl(savedLogo);
    }
  }

  const SECTIONS: SettingsSection[] = [
    { id: 'info',      title: 'Información', hint: 'Nombre, slogan y descripción de tu club',   icon: Building2, alert: SECTION_FIELDS.info.some(f => errors[f]) },
    { id: 'ubicacion', title: 'Ubicación',   hint: 'Dónde te encuentran tus clientes',          icon: MapPin,    alert: SECTION_FIELDS.ubicacion.some(f => errors[f]) },
    { id: 'contacto',  title: 'Contacto',    hint: 'Teléfono, email y horario de atención',     icon: Phone,     alert: SECTION_FIELDS.contacto.some(f => errors[f]) },
    { id: 'logo',      title: 'Logo',        hint: 'La imagen que identifica tu club',          icon: ImageIcon },
    { id: 'redes',     title: 'Redes',       hint: 'Links a tus redes sociales',                icon: Share2,    alert: SECTION_FIELDS.redes.some(f => errors[f]) },
    { id: 'fotos',     title: 'Fotos',       hint: 'Galería de tus instalaciones',              icon: Camera },
  ];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 pb-12">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-5">
          <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-2xl font-black text-gray-300 uppercase">Sin club registrado</p>
      </div>
    );
  }

  const clubPhotos: string[] = club.photos || [];
  const logoDirty = logoUrl !== savedLogo;
  const hasChanges = isDirty || logoDirty;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Panel Propietario
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">Mi Club</h1>
        <p className="text-gray-500 text-sm mt-1">Elige qué quieres editar — esto es lo que ven tus clientes</p>
      </div>

      {/* Link público */}
      {club.slug && (
        <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3">
          <Link2 className="h-5 w-5 text-lime-400 shrink-0" />
          <p className="text-sm text-gray-300 flex-1 truncate">reservatucancha.site/club/{club.slug}</p>
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(`https://reservatucancha.site/club/${club.slug}`); toast.success('Link copiado'); }}
            className="text-xs font-bold bg-lime-400 text-gray-900 px-3 py-1.5 rounded-full shrink-0"
          >
            Copiar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(v => saveMutation.mutate(v), onInvalid)} className="space-y-5">
        <SettingsTabs id="mi-club" sections={SECTIONS} active={section} onChange={setSection}>

          {section === 'info' && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Nombre del club <span className="text-red-500">*</span></label>
                <input className={inp} placeholder="Ej: Club Deportivo El Estadio" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className={lbl}>Slogan <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                <input className={inp} placeholder="La mejor cancha sintética de Villavicencio" {...register('slogan')} />
                {errors.slogan && <p className="text-xs text-red-500 mt-1">{errors.slogan.message}</p>}
              </div>
              <div>
                <label className={lbl}>Descripción <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                <textarea rows={5} className={inp} style={{ resize: 'none' }}
                  placeholder="Describe tu club, qué ofreces, qué lo hace especial..."
                  {...register('description')} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
              </div>
            </div>
          )}

          {section === 'ubicacion' && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Dirección</label>
                <input className={inp} placeholder="Ej: Calle 72 #45-23" {...register('address')} />
              </div>
              <div className="sm:max-w-xs">
                <label className={lbl}>Ciudad</label>
                <input className={inp} placeholder="Villavicencio" {...register('city')} />
              </div>
            </div>
          )}

          {section === 'contacto' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Teléfono</label>
                  <input className={inp} placeholder="300 123 4567" {...register('contactPhone')} />
                </div>
                <div>
                  <label className={lbl}>Email de contacto</label>
                  <input className={inp} placeholder="contacto@tuclub.com" {...register('contactEmail')} />
                  {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail.message}</p>}
                </div>
              </div>
              <div>
                <label className={lbl}>Horario de atención</label>
                <input className={inp} placeholder="Lunes a viernes 7am-10pm · Sábados y domingos 8am-8pm"
                  {...register('schedule')} />
                <p className="text-xs text-gray-400 mt-1.5">
                  Este texto se muestra tal cual en tu página pública.
                </p>
              </div>
            </div>
          )}

          {section === 'logo' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <button
                type="button"
                onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                className="w-28 h-28 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 hover:border-lime-400 flex items-center justify-center transition-colors overflow-hidden shrink-0"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Logo del club" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-9 w-9 text-gray-300" />
                )}
              </button>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-400 disabled:opacity-60 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
                >
                  <Upload className="h-4 w-4" />
                  {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                </button>
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl('')}
                    className="block text-sm font-semibold text-red-500 hover:text-red-600">
                    Quitar logo
                  </button>
                )}
                <p className="text-xs text-gray-400">Recomendado: 200×200px, PNG o JPG</p>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          )}

          {section === 'redes' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Estos links aparecen en tu página pública. Deja vacío para no mostrar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lblIcon}>
                    <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                  </label>
                  <input className={inp} placeholder="https://instagram.com/tuclub" {...register('instagram')} />
                  {errors.instagram && <p className="text-xs text-red-500 mt-1">{errors.instagram.message}</p>}
                </div>
                <div>
                  <label className={lblIcon}>
                    <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
                  </label>
                  <input className={inp} placeholder="https://facebook.com/tuclub" {...register('facebook')} />
                  {errors.facebook && <p className="text-xs text-red-500 mt-1">{errors.facebook.message}</p>}
                </div>
                <div>
                  <label className={lblIcon}>
                    <Music2 className="h-4 w-4 text-gray-900" /> TikTok
                  </label>
                  <input className={inp} placeholder="https://tiktok.com/@tuclub" {...register('tiktok')} />
                  {errors.tiktok && <p className="text-xs text-red-500 mt-1">{errors.tiktok.message}</p>}
                </div>
                <div>
                  <label className={lblIcon}>
                    <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
                  </label>
                  <input className={inp} placeholder="300 123 4567" {...register('whatsapp')} />
                  <p className="text-xs text-gray-400 mt-1.5">Número con indicativo o link wa.me</p>
                </div>
              </div>
            </div>
          )}

          {section === 'fotos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Parqueadero, vestidores, cafetería, áreas comunes</p>
                <p className="text-xs font-bold text-gray-400 shrink-0">
                  {clubPhotos.length} foto{clubPhotos.length !== 1 ? 's' : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => !uploadingPhotos && photosInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-green-300 rounded-xl py-8 flex flex-col items-center gap-2 transition-all"
              >
                {uploadingPhotos
                  ? <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                  : <Camera className="h-6 w-6 text-gray-400" />}
                <p className="text-sm font-bold text-gray-600">
                  {uploadingPhotos ? 'Subiendo...' : 'Agregar fotos de instalaciones'}
                </p>
                <p className="text-xs text-gray-400">Hasta 10 fotos por vez</p>
              </button>
              <input ref={photosInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handlePhotosUpload} />

              {clubPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {clubPhotos.map((url: string) => (
                    <div key={url} className="relative group rounded-xl overflow-hidden border border-gray-100">
                      <img src={url} alt="Instalación" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePhotoMutation.mutate(url)}
                          className="w-9 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">Las fotos se guardan al instante, no necesitas guardar cambios.</p>
            </div>
          )}
        </SettingsTabs>

        {/* Botones: fijos abajo para no perderlos al cambiar de sección */}
        {section !== 'fotos' && (
          <div className="sticky bottom-0 -mx-4 md:mx-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-6 pb-4 px-4 md:px-0">
            <div className="flex gap-3">
              <button type="button" onClick={handleDiscard}
                disabled={saveMutation.isPending || !hasChanges}
                className="flex-1 sm:flex-none sm:px-8 bg-white border-2 border-gray-200 hover:border-gray-400 disabled:opacity-50 text-gray-700 font-bold py-4 rounded-2xl transition-all">
                Descartar
              </button>
              <button type="submit" disabled={saveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20">
                {saveMutation.isPending
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
                  : <><Save className="h-5 w-5" /> Guardar cambios</>}
              </button>
            </div>
            {hasChanges && (
              <p className="text-xs text-gray-400 text-center mt-2">Tienes cambios sin guardar</p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
