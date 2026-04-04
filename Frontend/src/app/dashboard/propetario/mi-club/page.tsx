'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Upload, Trash2, Save, Loader2, Camera, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';

const CLOUD_NAME   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'clubs');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: formData,
  });
  if (!res.ok) throw new Error('Error subiendo imagen');
  return (await res.json()).secure_url as string;
}

export default function MiClubPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', address: '', city: '',
    contactPhone: '', contactEmail: '',
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: club, isLoading } = useQuery<any>({
    queryKey: ['my-club-profile'],
    queryFn: async () => {
      const { data } = await api.get('/clubs/my-club');
      return data;
    },
  });

  useEffect(() => {
    if (club) {
      setForm({
        name: club.name || '',
        description: club.description || '',
        address: club.address || '',
        city: club.city || '',
        contactPhone: club.contactPhone || '',
        contactEmail: club.contactEmail || '',
      });
      setLogoUrl(club.logo || '');
    }
  }, [club]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/clubs/my-club/profile', { ...form, logo: logoUrl });
    },
    onSuccess: () => {
      toast.success('Perfil actualizado');
      queryClient.invalidateQueries({ queryKey: ['my-club-profile'] });
      queryClient.invalidateQueries({ queryKey: ['club-info'] });
    },
    onError: () => toast.error('Error guardando perfil'),
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
    if (count) toast.success(`${count} foto${count > 1 ? 's' : ''} subida${count > 1 ? 's' : ''}`);
  }

  async function handleSave() {
    setSaving(true);
    await saveMutation.mutateAsync();
    setSaving(false);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>;
  }

  if (!club) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-2xl font-black text-gray-300 uppercase">Sin club registrado</p>
      </div>
    );
  }

  const clubPhotos: string[] = club.photos || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Panel Propietario
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Mi Club</h1>
        <p className="text-gray-500 text-sm mt-1">Personaliza la información de tu club — esto es lo que ven tus clientes</p>
      </div>

      {/* Link público */}
      {club.slug && (
        <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3">
          <Link2 className="h-5 w-5 text-lime-400 shrink-0" />
          <p className="text-sm text-gray-300 flex-1 truncate">reservatucancha.site/club/{club.slug}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(`https://reservatucancha.site/club/${club.slug}`); toast.success('Link copiado'); }}
            className="text-xs font-bold bg-lime-400 text-gray-900 px-3 py-1.5 rounded-full shrink-0"
          >
            Copiar
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Logo del club</p>
        <div className="flex items-center gap-6">
          <div
            onClick={() => !uploadingLogo && logoInputRef.current?.click()}
            className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 hover:border-lime-400 flex items-center justify-center cursor-pointer transition-colors overflow-hidden shrink-0"
          >
            {uploadingLogo ? (
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-gray-300" />
            )}
          </div>
          <div className="space-y-2">
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="text-sm font-bold text-green-700 hover:text-green-800"
            >
              {logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {logoUrl && (
              <button onClick={() => setLogoUrl('')} className="block text-sm text-red-500 hover:text-red-600">
                Quitar logo
              </button>
            )}
            <p className="text-xs text-gray-400">Recomendado: 200×200px, PNG o JPG</p>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      {/* Datos del club */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Información del club</p>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre del club</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">Descripción</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3} placeholder="Describe tu club, qué ofreces, qué lo hace especial..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Dirección</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Ciudad</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Teléfono</label>
            <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Email de contacto</label>
            <input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>

      {/* Fotos de instalaciones */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Fotos de instalaciones</p>
          <p className="text-xs text-gray-400">{clubPhotos.length} foto{clubPhotos.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Upload */}
        <div
          onClick={() => !uploadingPhotos && photosInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-green-300 rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-all"
        >
          {uploadingPhotos ? (
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          ) : (
            <Camera className="h-6 w-6 text-gray-400" />
          )}
          <p className="text-sm font-bold text-gray-600">
            {uploadingPhotos ? 'Subiendo...' : 'Agregar fotos de instalaciones'}
          </p>
          <p className="text-xs text-gray-400">Parqueadero, vestiarios, cafetería, áreas comunes</p>
          <input ref={photosInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handlePhotosUpload} />
        </div>

        {/* Grid */}
        {clubPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {clubPhotos.map((url: string) => (
              <div key={url} className="relative group rounded-xl overflow-hidden border border-gray-100">
                <img src={url} alt="Instalación" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
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
      </div>
    </div>
  );
}
