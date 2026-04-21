'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  toleranciaMinutos: number;
  diasAntelacionMax: number;
}

export function CapacidadForm({ toleranciaMinutos, diasAntelacionMax }: Props) {
  const [tolerancia, setTolerancia] = useState(tolerenciaMinutos);
  const [dias, setDias] = useState(diasAntelacionMax);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toleranciaMinutos: parseInt(String(tolerencia)),
          diasAntelacionMax: parseInt(String(dias)),
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: 'Error al guardar' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Tolerancia (minutos)</label>
        <input
          type="number"
          value={tolerancia}
          onChange={(e) => setTolerancia(Number(e.target.value))}
          min={0}
          max={30}
          className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <p className="text-xs text-gray-500 mt-1">Minutos de tolerancia para la llegada</p>
      </div>
      
      <div>
        <label className="text-sm font-medium text-gray-700">Días de anticipación máxima</label>
        <input
          type="number"
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          min={1}
          max={90}
          className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <p className="text-xs text-gray-500 mt-1">Cuántos días adelante se puede reservar</p>
      </div>
      
      {message && (
        <div className={`md:col-span-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </div>
      )}
      
      <div className="md:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </form>
  );
}
