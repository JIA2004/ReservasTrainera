'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Users } from 'lucide-react';

interface Reserva {
  id: string;
  nombre: string;
  apellido: string;
  comensales: number;
  estado: string;
  mesas: { mesa: { id: string } }[];
}

interface Props {
  reservas: Reserva[];
  hora: string;
  mesaId: string;
  mesaNombre: string;
  reservaActualId?: string;
}

export function MesaSelector({ reservas, hora, mesaId, mesaNombre, reservaActualId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reservas disponibles en este horario (que no tengan esta mesa asignada)
  const disponibles = reservas.filter(
    (r) => !r.mesas.some((m) => m.mesa.id === mesaId)
  );

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAsignar = async (reservaId: string) => {
    // Si ya hay una reserva asignada a esta mesa, primero la desasignamos
    if (reservaActualId) {
      setLoading(reservaActualId);
      try {
        const res = await fetch(
          `/api/admin/reservas/${reservaActualId}/mesas?mesaId=${mesaId}`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Error al desasignar');
          setLoading(null);
          return;
        }
      } catch {
        setError('Error de conexión');
        setLoading(null);
        return;
      }
    }

    // Asignar la nueva reserva
    setLoading(reservaId);
    setError(null);

    try {
      const res = await fetch(`/api/admin/reservas/${reservaId}/mesas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesaId }),
      });

      if (res.ok) {
        router.refresh();
        setOpen(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al asignar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(null);
    }
  };

  const handleLiberar = async () => {
    if (!reservaActualId) return;

    setLoading('liberar');
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/reservas/${reservaActualId}/mesas?mesaId=${mesaId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        router.refresh();
        setOpen(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al liberar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-full h-full flex items-center justify-center text-sm font-medium
          transition-colors rounded-lg
          ${
            reservaActualId
              ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
              : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
          }
        `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : reservaActualId ? (
          <span className="truncate px-1">
            {reservas.find((r) => r.id === reservaActualId)?.nombre ||
              reservaActualId.slice(0, 8)}
          </span>
        ) : (
          <span className="text-stone-400">—</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {mesaNombre}
            </span>
            <span className="text-xs text-gray-400">{hora}</span>
          </div>

          {/* Opciones */}
          <div className="max-h-48 overflow-y-auto py-1">
            {reservaActualId && (
              <button
                onClick={handleLiberar}
                disabled={loading !== null}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
              >
                <X className="h-4 w-4" />
                Liberar mesa
              </button>
            )}

            {disponibles.length === 0 && !reservaActualId ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No hay reservas disponibles
              </div>
            ) : (
              disponibles.map((reserva) => (
                <button
                  key={reserva.id}
                  onClick={() => handleAsignar(reserva.id)}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 disabled:opacity-50"
                >
                  {loading === reserva.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600 opacity-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {reserva.nombre} {reserva.apellido}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {reserva.comensales}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {error && (
            <div className="px-3 py-2 text-xs text-red-600 border-t border-gray-100">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}