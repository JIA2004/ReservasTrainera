'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, CalendarDays, Clock } from 'lucide-react';

interface Props {
  reservaId: string;
  cancelToken: string;
  comensales: number;
  horarios: string[];
  maxDiasAnticipacion: number;
}

export function ReprogramarForm({ reservaId, cancelToken, comensales, horarios, maxDiasAnticipacion }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHora, setSelectedHora] = useState<string>('');
  const [disponibilidad, setDisponibilidad] = useState<Record<string, number>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const router = useRouter();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = addDays(today, maxDiasAnticipacion);

  // Load disponibilidad when date changes
  useEffect(() => {
    if (!selectedDate) {
      setDisponibilidad({});
      setSelectedHora('');
      return;
    }

    const loadDisponibilidad = async () => {
      setLoadingSlots(true);
      setSelectedHora('');
      try {
        const fechaStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/disponibilidad?fecha=${fechaStr}`);
        const data = await res.json();

        if (data.disponibilidad) {
          const slots: Record<string, number> = {};
          data.disponibilidad.forEach((slot: { hora: string; disponibles: number }) => {
            slots[slot.hora.trim()] = slot.disponibles;
          });
          setDisponibilidad(slots);
        }
      } catch (err) {
        console.error('Error cargando disponibilidad:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadDisponibilidad();
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedHora) {
      setError('Por favor seleccioná fecha y horario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/reservas/${reservaId}/reprogramar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedHora,
          cancelToken,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/confirmacion/${data.reserva.id}`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.mensaje || 'Error al reprogramar');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Filter valid days (martes a sábado)
  const diasValidos = (date: Date) => {
    const day = date.getDay();
    return day >= 2 && day <= 6;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Date picker */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <CalendarDays className="w-4 h-4 inline mr-2 text-green-600" />
          Seleccioná una fecha
        </label>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < today || date > maxDate || !diasValidos(date)}
            fromDate={today}
            toDate={maxDate}
            locale={es}
            className="rounded-lg border border-gray-200 bg-white"
          />
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Solo aceptamos reservas de martes a sábado
        </p>
      </div>

      {/* Time selector */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Clock className="w-4 h-4 inline mr-2 text-green-600" />
            Seleccioná un horario
          </label>
          <Select value={selectedHora} onValueChange={setSelectedHora}>
            <SelectTrigger className="border-gray-200 bg-white">
              <SelectValue placeholder="Elegí un horario" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {horarios.map((hora) => {
                const horaKey = hora.trim();
                const disponibles = disponibilidad[horaKey] ?? 0;
                const puede = disponibles > 0;
                return (
                  <SelectItem key={horaKey} value={horaKey} disabled={!puede}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">{horaKey}</span>
                      <span className={`ml-4 text-sm ${puede ? 'text-green-600' : 'text-red-400'}`}>
                        {puede ? `${disponibles} lugares` : 'Completo'}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {loadingSlots && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando disponibilidad...
            </p>
          )}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={loading || !selectedDate || !selectedHora}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Reprogramando...
          </span>
        ) : (
          'Confirmar nueva fecha'
        )}
      </Button>
    </div>
  );
}
