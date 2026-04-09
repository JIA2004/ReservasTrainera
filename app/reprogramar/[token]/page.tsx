import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { ReprogramarForm } from './_components/reprogramar-form';
import { CalendarClock, ArrowRight } from 'lucide-react';

interface Props {
  params: { token: string };
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

async function getConfig() {
  const config = await prisma.configuracion.findFirst();
  return config;
}

export default async function ReprogramarPage({ params }: Props) {
  const reserva = await getReservaByToken(params.token);
  const config = await getConfig();

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
                <CalendarClock className="w-8 h-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reserva cancelada</h1>
              <p className="text-gray-500 mb-6">
                Esta reserva fue cancelada y no puede ser reprogramada.
              </p>
              <Link href="/" className="text-red-600 hover:text-red-700 font-medium">
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fechaActual = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaActual = reserva.hora.substring(0, 5);
  const horarios = config?.horariosReservas?.split(',') || [];

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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CalendarClock className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reprogramar reserva
            </h1>
            <p className="text-gray-500">
              Seleccioná una nueva fecha y horario
            </p>
          </div>

          {/* Current reservation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
              <p className="text-white font-medium flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Reserva actual
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-amber-600">
                    {horaActual}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 capitalize">{fechaActual}</p>
                  <p className="text-gray-500">{horaActual} hrs · {reserva.comensales} comensales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-green-600 rotate-90" />
            </div>
          </div>

          {/* New reservation form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <p className="text-white font-medium flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Nueva fecha y horario
              </p>
            </div>
            <div className="p-6">
              <ReprogramarForm
                reservaId={reserva.id}
                comensales={reserva.comensales}
                horarios={horarios}
                maxDiasAnticipacion={config?.diasAntelacionMax || 30}
              />
            </div>
          </div>

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
