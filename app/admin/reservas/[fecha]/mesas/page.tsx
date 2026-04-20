export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Armchair, Grid3X3, Loader2 } from 'lucide-react';
import { MesaGrid } from '@/components/admin/mesa-grid';

interface Props {
  params: Promise<{ fecha: string }>;
}

async function getData(fecha: string) {
  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { reservas: [], mesas: [] };
  }

  const [year, month, day] = fecha.split('-').map(Number);
  const fechaDate = new Date(Date.UTC(year, month - 1, day));

  // Obtener reservas del día
  const reservas = await prisma.reserva.findMany({
    where: {
      fecha: fechaDate,
      estado: {
        notIn: ['CANCELADA'],
      },
    },
    include: {
      mesas: {
        include: {
          mesa: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
    },
    orderBy: {
      hora: 'asc',
    },
  });

  // Obtener todas las mesas
  const mesas = await prisma.mesa.findMany({
    where: { activa: true },
    orderBy: [
      { tipo: 'asc' },
      { nombre: 'asc' },
    ],
  });

  return { reservas, mesas };
}

export default async function AdminMesasPage({ params }: Props) {
  const resolvedParams = await params;
  const fecha = resolvedParams.fecha;

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    notFound();
  }

  const [year, month, day] = fecha.split('-').map(Number);
  const fechaDate = new Date(year, month - 1, day);

  // Fetch data
  const { reservas, mesas } = await getData(fecha);

  const totalComensales = reservas.reduce((sum, r) => sum + r.comensales, 0);
  const horariosUnicos = [...new Set(reservas.map((r) => r.hora))].sort();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/reservas/${fecha}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-brand mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a reservas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-3">
              <Armchair className="h-7 w-7 text-brand" />
              Ocupación de Mesas
            </h1>
            <p className="text-gray-500">
              {format(fechaDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })} ·{' '}
              {reservas.length} reservas · {totalComensales} comensales
            </p>
          </div>

          <Link
            href="/admin/config"
            className="text-sm text-gray-500 hover:text-brand transition-colors"
          >
            Configurar mesas →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-brand to-red-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-brand-100 text-sm">Mesa más usada</p>
              <p className="text-2xl font-bold">
                {mesas.length > 0 ? 'Mix' : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Armchair className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Horarios activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {horariosUnicos.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Mesas totales</p>
              <p className="text-2xl font-bold text-gray-900">{mesas.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <MesaGrid
        reservas={reservas}
        mesas={mesas}
        fecha={fecha}
      />
    </div>
  );
}