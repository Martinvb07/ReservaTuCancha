'use client';

import { useState, useRef } from 'react';
import { Image, Upload, Trash2, Star, Plus, X, CheckCircle } from 'lucide-react';

const MOCK_CANCHAS = [
  { id: '1', name: 'SuperCampeones — Cancha 1', sport: '⚽ Fútbol' },
  { id: '2', name: 'SuperCampeones — Cancha 2', sport: '⚽ Fútbol' },
];

const MOCK_FOTOS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80', principal: true  },
  { id: '2', url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&q=80', principal: false },
  { id: '3', url: 'https://images.unsplash.com/photo-1551958219-acbc595b8cc8?w=400&q=80',    principal: false },
];

export default function OwnerFotosPage() {
  const [selectedCancha, setSelectedCancha] = useState(MOCK_CANCHAS[0].id);
  const [fotos, setFotos]                   = useState(MOCK_FOTOS);
  const [dragging, setDragging]             = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSetPrincipal = (id: string) =>
    setFotos(prev => prev.map(f => ({ ...f, principal: f.id === id })));

  const handleDelete = (id: string) =>
    setFotos(prev => prev.filter(f => f.id !== id));

  const cancha = MOCK_CANCHAS.find(c => c.id === selectedCancha);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Panel Propietario
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Galería de fotos</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona las fotos de tus canchas — la foto principal es la que ven los clientes primero</p>
      </div>

      {/* Selector de cancha */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Selecciona una cancha</p>
        <div className="flex flex-wrap gap-3">
          {MOCK_CANCHAS.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCancha(c.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedCancha === c.id
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              {c.sport} {c.name}
              {selectedCancha === c.id && <CheckCircle className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Zona de subida */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); /* handle files */ }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl py-12 flex flex-col items-center gap-3 cursor-pointer transition-all ${
          dragging
            ? 'border-green-400 bg-green-50'
            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Upload className="h-7 w-7 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-black text-gray-700">Arrastra fotos aquí o haz click para subir</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG · Máx 5MB por foto · Recomendado: 1280×720px</p>
        </div>
        <div className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> Seleccionar fotos
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => { /* handle upload */ }}
        />
      </div>

      {/* Galería */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
            {fotos.length} fotos — {cancha?.name}
          </p>
          <p className="text-xs text-gray-400">Haz click en ⭐ para establecer como foto principal</p>
        </div>

        {fotos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Image className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-black text-gray-400 uppercase text-sm">Sin fotos aún</p>
            <p className="text-gray-400 text-xs mt-1">Sube fotos de tu cancha para atraer más clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fotos.map(f => (
              <div key={f.id} className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                f.principal ? 'border-lime-400 shadow-lg' : 'border-gray-100 hover:border-gray-300'
              }`}>
                <img src={f.url} alt="foto cancha" className="w-full h-44 object-cover" />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleSetPrincipal(f.id)}
                    title="Establecer como principal"
                    className="w-10 h-10 rounded-xl bg-lime-400 hover:bg-lime-300 text-gray-900 flex items-center justify-center transition-colors"
                  >
                    <Star className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    title="Eliminar foto"
                    className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Badge principal */}
                {f.principal && (
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