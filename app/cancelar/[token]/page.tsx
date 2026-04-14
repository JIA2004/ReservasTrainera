import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { CancelForm } from './_components/cancel-form';
import { AlertCircle, CalendarDays, Clock, Users, MapPin } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

async function getReservaByToken(token: string) {
  const reserva = await prisma.reserva.findUnique({
    where: { cancelToken: token },
    include: {
      mesas: {
        include: { mesa: true },
      },
    },
  });
  return reserva;
}

export default async function CancelarPage({ params }: Props) {
  const resolvedParams = await params;
  const reserva = await getReservaByToken(resolvedParams.token);

  if (!reserva) {
    notFound();
  }

  // Si ya está cancelada, mostrar mensaje
  if (reserva.estado === 'CANCELADA') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50">
        <header className="bg-white/80 backdrop-blur-sm border-b py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="relative w-32 h-10 block">
              <Image
                src="/imgs/LogoSinFondo.png"
                alt="Trainera"
                fill
                className="object-contain"
              />
            </Link>
          </div>
        </header>
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reserva ya cancelada</h1>
              <p className="text-gray-500 mb-6">
                Esta reserva fue cancelada anteriormente.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
              >
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <Link href="/" className="relative w-32 h-10 block">
            <Image
              src="/imgs/LogoSinFondo.png"
              alt="Trainera"
              fill
              className="object-contain"
            />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-md">
          {/* Warning card */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¿Cancelar reserva?
            </h1>
            <p className="text-gray-500">
              Esta acción no se puede deshacer
            </p>
          </div>

          {/* Reservation details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <p className="text-white font-medium flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Reserva a cancelar
              </p>
            </div>
            <div className="p-6">
              {/* Date & time */}
              <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-red-600">
                    {reserva.hora.substring(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha y horario</p>
                  <p className="font-semibold text-gray-900 capitalize">{fechaFormateada}</p>
                  <p className="text-gray-600">{horaFormateada} hrs</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Comensales</p>
                    <p className="font-medium text-gray-900">{reserva.comensales}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Horario</p>
                    <p className="font-medium text-gray-900">{horaFormateada}</p>
                  </div>
                </div>
              </div>

              {/* Client info */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">A nombre de</p>
                <p className="font-semibold text-gray-900">{reserva.nombre} {reserva.apellido}</p>
                <p className="text-sm text-gray-500">{reserva.email}</p>
              </div>
            </div>
          </div>

          {/* Cancel form */}
          <CancelForm reservaId={reserva.id} />

          {/* Back link */}
          <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-gray-500 hover:text-red-600 text-sm transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Trainera - Cocina Vasca</p>
        </div>
      </footer>
    </div>
  );
}
