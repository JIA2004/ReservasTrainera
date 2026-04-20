'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Armchair, Grid3X3 } from 'lucide-react';
import { MesaSelector } from './mesa-selector';

interface Reserva {
  id: string;
  nombre: string;
  apellido: string;
  comensales: number;
  estado: string;
  hora: string;
  mesas: { mesa: { id: string; nombre: string } }[];
}

interface Mesa {
  id: string;
  nombre: string;
  capacidad: number;
  tipo: 'MESA' | 'BARRA';
}

interface Props {
  reservas: Reserva[];
  mesas: Mesa[];
  fecha: string;
}

export function MesaGrid({ reservas: initialReservas, mesas, fecha }: Props) {
  const router = useRouter();
  const [reservas, setReservas] = useState(initialReservas);
  const [loading, setLoading] = useState(true);

  // Obtener todos los horarios únicos
  const horarios = [...new Set(reservas.map((r) => r.hora))].sort();

  // Cargar datos frescos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/reservas/by-fecha/${fecha}`);
        if (res.ok) {
          const data = await res.json();
          setReservas(data.reservas);
        }
      } catch (error) {
        console.error('Error fetching:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fecha]);

  // Obtener reserva asignada a una mesa en un horario
  const getReservaParaMesa = (mesaId: string, hora: string) => {
    return reservas.find(
      (r) =>
        r.hora === hora && r.mesas.some((m) => m.mesa.id === mesaId)
    );
  };

  // Obtener stats por mesa
  const getStatsMesa = (mesaId: string) => {
    const asignadaCount = reservas.filter((r) =>
      r.mesas.some((m) => m.mesa.id === mesaId)
    ).length;
    const mesa = mesas.find((m) => m.id === mesaId);
    return {
      asignada: asignadaCount,
      capacidad: mesa?.capacidad || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (horarios.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Grid3X3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay reservas para este día
        </h3>
        <p className="text-gray-500">
          Las reservas aparecerán aquí cuando los clientes reserven.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-gray-500 font-medium">Estado:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-stone-100 border border-stone-200"></div>
          <span className="text-gray-600">Libre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span className="text-gray-600">Ocupada</span>
        </div>
      </div>

      {/* Grid de mesas por horario */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-gray-500 pb-3 pr-4 w-24">
                Horario
              </th>
              {mesas.filter((m) => m.activa).map((mesa) => (
                <th
                  key={mesa.id}
                  className="text-center text-sm font-medium text-gray-500 pb-3 px-1"
                >
                  <div className="flex flex-col items-center">
                    <Armchair className="h-4 w-4 mb-1 text-gray-400" />
                    <span>{mesa.nombre}</span>
                    <span className="text-xs font-normal text-gray-400">
                      ({mesa.capacidad})
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map((hora) => (
              <tr key={hora} className="border-t border-gray-100">
                <td className="py-3 pr-4">
                  <div className="font-semibold text-gray-900">{hora}</div>
                  <div className="text-xs text-gray-400">
                    {
                      reservas.filter((r) => r.hora === hora).length
                    }{' '}
                    reservas
                  </div>
                </td>
                {mesas.filter((m) => m.activa).map((mesa) => {
                  const reserva = getReservaParaMesa(mesa.id, hora);
                  const stats = getStatsMesa(mesa.id);

                  return (
                    <td key={mesa.id} className="p-1 align-top">
                      <MesaSelector
                        reservas={reservas.filter((r) => r.hora === hora)}
                        hora={hora}
                        mesaId={mesa.id}
                        mesaNombre={mesa.nombre}
                        reservaActualId={reserva?.id}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats finales */}
      <div className="bg-stone-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Resumen de ocupación
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {mesas
            .filter((m) => m.activa)
            .map((mesa) => {
              const stats = getStatsMesa(mesa.id);
              const ocupacion = stats.capacidad > 0
                ? Math.round((stats.asignada / stats.capacidad) * 100)
                : 0;

              return (
                <div
                  key={mesa.id}
                  className="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div className="font-medium text-gray-900 text-sm">
                    {mesa.nombre}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {stats.asignada}/{stats.capacidad}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                        style={{ width: `${Math.min(ocupacion, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {ocupacion}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}