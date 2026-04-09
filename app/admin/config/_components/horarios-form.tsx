'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  horariosDisponibles: string[];
}

const todosHorarios = [
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'
];

export function HorariosForm({ horariosDisponibles }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(horariosDisponibles.map(h => h.trim()))
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const toggleHorario = (hora: string) => {
    const newSet = new Set(selected);
    if (newSet.has(hora)) {
      newSet.delete(hora);
    } else {
      newSet.add(hora);
    }
    setSelected(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const horariosArray = Array.from(selected).sort();
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horariosReservas: horariosArray.join(',') }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Horarios actualizados correctamente' });
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {todosHorarios.map((hora) => (
          <label
            key={hora}
            className={`
              flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors
              ${selected.has(hora)
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="checkbox"
              checked={selected.has(hora)}
              onChange={() => toggleHorario(hora)}
              className="sr-only"
            />
            <span className={`w-5 h-5 rounded border flex items-center justify-center ${
              selected.has(hora) ? 'bg-primary border-primary' : 'border-gray-400'
            }`}>
              {selected.has(hora) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium">{hora}</span>
          </label>
        ))}
      </div>
      
      {message && (
        <div className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </div>
      )}
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar horarios'}
      </Button>
    </form>
  );
}
