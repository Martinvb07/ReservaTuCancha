'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Upload, Trash2, Star, Plus, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';

const CLOUD_NAME   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'courts');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Error subiendo imagen a Cloudinary');
  const data = await res.json();
  return data.secure_url as string;
}

export default function OwnerFotosPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [dragging, setDragging]               = useState(false);
  const [uploading, setUploading]             = useState(false);

  type Court = { _id: string; name: string; sport: string; photos: string[] };

  // Cargar canchas del owner
  const { data: courts = [], isLoading: loadingCourts } = useQuery<Court[]>({
    queryKey: ['my-courts'],
    queryFn: async () => {
      const { data } = await api.get('/courts/owner/my-courts');
      return data as Court[];
    },
  });

  useEffect(() => {
    if (courts.length > 0 && !selectedCourtId) {
      setSelectedCourtId(courts[0]._id);
    }
  }, [courts, selectedCourtId]);

  const selectedCourt = courts.find(c => c._id === selectedCourtId);
  const fotos = selectedCourt?.photos ?? [];

  // Agregar foto
  const addPhotoMutation = useMutation({
    mutationFn: (url: string) => api.post(`/courts/${selectedCourtId}/photos`, { url }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-courts'] }),
  });

  // Eliminar foto
  const removePhotoMutation = useMutation({
    mutationFn: (url: string) => api.delete(`/courts/${selectedCourtId}/photos`, { data: { url } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-courts'] }),
    onError: () => toast.error('Error eliminando foto'),
  });

  // Establecer como principal (moverla al índice 0)
  const setPrincipalMutation = useMutation({
    mutationFn: async (url: string) => {
      const otherPhotos = fotos.filter(f => f !== url);
      const newOrder = [url, ...otherPhotos];
      // Eliminar todas y volver a agregar en orden
      for (const f of fotos) {
        await api.delete(`/courts/${selectedCourtId}/photos`, { data: { url: f } });
      }
      for (const f of newOrder) {
        await api.post(`/courts/${selectedCourtId}/photos`, { url: f });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courts'] });
      toast.success('Foto principal actualizada');
    },
    onError: () => toast.error('Error actualizando foto principal'),
  });

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!selectedCourtId) return;
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 10);
    if (arr.length === 0) return;

    setUploading(true);
    let uploaded = 0;
    for (const file of arr) {
      try {
        const url = await uploadToCloudinary(file);
        await addPhotoMutation.mutateAsync(url);
        uploaded++;
      } catch {
        toast.error(`Error subiendo ${file.name}`);
      }
    }
    setUploading(false);
    if (uploaded > 0) toast.success(`${uploaded} foto${uploaded > 1 ? 's' : ''} subida${uploaded > 1 ? 's' : ''}`);
  }, [selectedCourtId, addPhotoMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  function sportIcon(sport: string) {
    if (sport?.includes('futbol')) return '⚽';
    if (sport?.includes('padel')) return '🎾';
    if (sport?.includes('voley')) return '🏐';
    return '🏟️';
  }

  if (loadingCourts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-2xl font-black text-gray-300 uppercase">Sin canchas registradas</p>
        <p className="text-gray-400 text-sm mt-2">Primero crea una cancha desde el panel</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Panel Propietario
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Galería de fotos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona las fotos de tus canchas — la primera foto es la que ven los clientes primero
        </p>
      </div>

      {/* Selector de cancha */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Selecciona una cancha</p>
        <div className="flex flex-wrap gap-3">
          {courts.map(c => (
            <button
              key={c._id}
              onClick={() => setSelectedCourtId(c._id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedCourtId === c._id
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              {sportIcon(c.sport)} {c.name}
              <span className="text-xs font-normal text-gray-400">({c.photos?.length ?? 0})</span>
              {selectedCourtId === c._id && <CheckCircle className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Zona de subida */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl py-12 flex flex-col items-center gap-3 cursor-pointer transition-all ${
          dragging
            ? 'border-green-400 bg-green-50'
            : uploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          {uploading
            ? <Loader2 className="h-7 w-7 text-green-500 animate-spin" />
            : <Upload className="h-7 w-7 text-gray-400" />
          }
        </div>
        <div className="text-center">
          <p className="font-black text-gray-700">
            {uploading ? 'Subiendo fotos...' : 'Arrastra fotos aquí o haz click para subir'}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG · Máx 5MB por foto · Recomendado: 1280×720px</p>
        </div>
        {!uploading && (
          <div className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
            <Plus className="h-4 w-4" /> Seleccionar fotos
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Galería */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
            {fotos.length} foto{fotos.length !== 1 ? 's' : ''} — {selectedCourt?.name}
          </p>
          {fotos.length > 0 && (
            <p className="text-xs text-gray-400">⭐ = establecer como foto principal</p>
          )}
        </div>

        {fotos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Image className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-black text-gray-400 uppercase text-sm">Sin fotos aún</p>
            <p className="text-gray-400 text-xs mt-1">Sube fotos de tu cancha para atraer más clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fotos.map((url, idx) => (
              <div
                key={url}
                className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                  idx === 0 ? 'border-lime-400 shadow-lg' : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <img src={url} alt="foto cancha" className="w-full h-44 object-cover" />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {idx !== 0 && (
                    <button
                      onClick={() => setPrincipalMutation.mutate(url)}
                      disabled={setPrincipalMutation.isPending}
                      title="Establecer como principal"
                      className="w-10 h-10 rounded-xl bg-lime-400 hover:bg-lime-300 text-gray-900 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => removePhotoMutation.mutate(url)}
                    disabled={removePhotoMutation.isPending}
                    title="Eliminar foto"
                    className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Badge principal */}
                {idx === 0 && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1 bg-lime-400 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full">
                      <Star className="h-3 w-3" /> Principal
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2">
        <p className="text-sm font-black text-blue-800">💡 Tips para mejores fotos</p>
        <ul className="space-y-1 text-xs text-blue-700">
          <li>• Toma fotos con buena iluminación natural o con la iluminación nocturna encendida</li>
          <li>• Muestra toda la cancha en la foto principal — que se vea el campo completo</li>
          <li>• Incluye fotos de los vestidores, parqueadero y áreas comunes si los tienes</li>
          <li>• Las canchas con más de 3 fotos reciben un 40% más de reservas</li>
        </ul>
      </div>
    </div>
  );
}
