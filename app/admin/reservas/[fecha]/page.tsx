export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, Users, AlertCircle } from 'lucide-react';
import { ReservaCard } from './_components/reserva-card';

interface Props {
  params: { fecha: string };
}

async function getReservasDelDia(fecha: string) {
  // Usar UTC para evitar timezone issues con PostgreSQL
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaDate = new Date(Date.UTC(year, month - 1, day));
  
  const reservas = await prisma.reserva.findMany({
    where: {
      fecha: fechaDate,
      estado: {
        notIn: ['CANCELADA'],
      },
    },
    include: {
      mesas: {
        include: { mesa: true },
      },
    },
    orderBy: {
      hora: 'asc',
    },
  });

  return reservas;
}

export default async function AdminReservasDiaPage({ params }: Props) {
  const fecha = params.fecha;
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    notFound();
  }

  const reservas = await getReservasDelDia(fecha);
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaDate = new Date(year, month - 1, day);

  // Group by hour
  const reservasPorHora: Record<string, typeof reservas> = {};
  reservas.forEach((reserva) => {
    if (!reservasPorHora[reserva.hora]) {
      reservasPorHora[reserva.hora] = [];
    }
    reservasPorHora[reserva.hora].push(reserva);
  });

  const totalComensales = reservas.reduce((sum, r) => sum + r.comensales, 0);
  const pendientes = reservas.filter((r) => r.estado === 'PENDIENTE' || r.estado === 'REQUIERE_ATENCION').length;
  const requierenAtencion = reservas.filter((r) => r.estado === 'REQUIERE_ATENCION').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al calendario
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {format(fechaDate, "EEEE d 'de' MMMM", { locale: es })}
            </h1>
            <p className="text-gray-500">
              {format(fechaDate, 'yyyy')} · {reservas.length} reservas · {totalComensales} comensales
            </p>
          </div>
          
          <Link href="/admin/config" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Configurar horarios →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-red-100 text-sm">Total reservas</p>
              <p className="text-3xl font-bold">{reservas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total comensales</p>
              <p className="text-3xl font-bold text-gray-900">{totalComensales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendientes > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <AlertCircle className={`w-5 h-5 ${pendientes > 0 ? 'text-amber-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pendientes</p>
              <p className="text-3xl font-bold text-gray-900">
                {pendientes}
                {requierenAtencion > 0 && (
                  <span className="text-sm font-normal text-orange-600 ml-2">
                    ({requierenAtencion} ⚠️)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations by hour */}
      {Object.keys(reservasPorHora).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay reservas para este día
          </h3>
          <p className="text-gray-500">
            Las reservas aparecerán aquí cuando los clientes reserven.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(reservasPorHora)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([hora, reservas]) => (
              <div key={hora}>
                {/* Hour header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-sm">
                    {hora.substring(0, 5)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-sm">
                      {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm">
                      {reservas.reduce((sum, r) => sum + r.comensales, 0)} comensales
                    </span>
                  </div>
                </div>
                
                {/* Reservation cards */}
                <div className="grid gap-3">
                  {reservas.map((reserva) => (
                    <ReservaCard key={reserva.id} reserva={reserva} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
