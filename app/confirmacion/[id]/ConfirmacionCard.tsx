'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, CalendarDays, Clock, Users, MapPin, Phone, Calendar, XCircle, RefreshCw, Mail } from 'lucide-react';

interface ReservaData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha: string;
  hora: string;
  comensales: number;
  cancelToken: string;
}

interface Props {
  reservaId: string;
}

export function ConfirmacionCard({ reservaId }: Props) {
  const [reserva, setReserva] = useState<ReservaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [esTemporal, setEsTemporal] = useState(false);

  useEffect(() => {
    if (reservaId.startsWith('temp-')) {
      setEsTemporal(true);
      setLoading(false);
      return;
    }

    const saved = localStorage.getItem('ultimaReserva');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.id === reservaId) {
          setReserva(data);
        }
      } catch (e) {
        console.error('Error parsing saved reserva');
      }
    }
    setLoading(false);
  }, [reservaId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (time: string) => time.substring(0, 5);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  // Fallback for temp reservations
  if (esTemporal || !reserva) {
    return (
      <div className="max-w-md mx-auto">
        {/* Hero Success */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand to-red-700 rounded-full mb-6 shadow-lg shadow-brand/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Reserva recibida!
          </h1>
          <p className="text-stone-400">
            Te contactaremos pronto para confirmar.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-stone-800/50 rounded-2xl border border-stone-700 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-brand to-red-700 px-6 py-4">
            <p className="text-white font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              ¡Gracias por tu reserva!
            </p>
          </div>
          <div className="p-6">
            <div className="bg-stone-900/50 border border-stone-700 rounded-xl p-4 mb-6">
              <p className="text-stone-300 text-sm">
                <strong className="text-white">Importante:</strong> Tenemos una tolerancia de <span className="font-semibold text-white">10 minutos</span> al horario de reserva.
              </p>
            </div>

            <div className="space-y-3 text-stone-400 mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-brand" />
                <span>Constitución 306, Rosario</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand" />
                <span>3416-880752</span>
              </div>
            </div>

            <Link href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-brand hover:bg-brand/90 text-white">
                <Mail className="w-4 h-4 mr-2" />
                Ver carta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Hero Success */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand to-red-700 rounded-full mb-6 shadow-lg shadow-brand/30">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          ¡Reserva confirmada!
        </h1>
        <p className="text-stone-400">
          guardar:: {' '} estos datos para cualquier consulta
        </p>
      </div>

      {/* Reservation Card */}
      <div className="bg-stone-800/50 rounded-2xl border border-stone-700 overflow-hidden mb-6 backdrop-blur-sm">
        {/* Header with brand color */}
        <div className="bg-gradient-to-r from-brand to-red-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold capitalize">{formatDate(reserva.fecha)}</p>
                <p className="text-white/80 text-sm">{formatTime(reserva.hora)} hrs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          {/* Guest info */}
          <div className="flex items-center gap-4 pb-5 border-b border-stone-700">
            <div className="w-12 h-12 bg-gradient-to-br from-brand to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-brand/20">
              <span className="text-xl font-bold text-white">
                {reserva.comensales}
              </span>
            </div>
            <div>
              <p className="text-sm text-stone-500">A nombre de</p>
              <p className="font-semibold text-white">
                {reserva.nombre} {reserva.apellido}
              </p>
            </div>
          </div>

          {/* Time and guests */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-700 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Horario</p>
                <p className="font-medium text-white">{formatTime(reserva.hora)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-700 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Comensales</p>
                <p className="font-medium text-white">{reserva.comensales}</p>
              </div>
            </div>
          </div>

          {/* Important notice */}
          <div className="bg-stone-900/50 border border-stone-700 rounded-xl p-4">
            <p className="text-stone-300 text-sm">
              <strong className="text-white">Nota:</strong> Tolerancia de <span className="font-semibold text-white">10 min</span> al horario. Te esperamos con gusto.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-stone-800/50 rounded-2xl border border-stone-700 p-6 backdrop-blur-sm">
        <p className="text-center text-stone-400 text-sm mb-4">
          ¿Necesitás hacer algún cambio?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/reprogramar/${reserva.cancelToken}`}>
            <Button variant="outline" className="w-full gap-2 border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-white">
              <RefreshCw className="w-4 h-4" />
              Reprogramar
            </Button>
          </Link>
          <Link href={`/cancelar/${reserva.cancelToken}`}>
            <Button variant="outline" className="w-full gap-2 border-stone-600 text-stone-300 hover:bg-red-600 hover:text-white hover:border-red-600">
              <XCircle className="w-4 h-4" />
              Cancelar
            </Button>
          </Link>
        </div>
      </div>

      {/* Location card */}
      <div className="mt-6 bg-stone-800/50 rounded-2xl border border-stone-700 p-6 backdrop-blur-sm">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand" />
          Cómo llegar
        </h3>
        <div className="space-y-2 text-stone-400 text-sm">
          <p>Constitución 306</p>
          <p>Entre Catamarca y Tucumán</p>
          <p>Rosario, Santa Fe</p>
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-stone-500" />
          <a href="tel:+543416880752" className="text-brand hover:text-red-400 transition-colors">
            3416-880752
          </a>
        </div>
      </div>

      {/* Menu CTA */}
      <div className="mt-6 text-center">
        <Link href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer">
          <Button variant="link" className="text-brand hover:text-red-400 gap-2">
            <Mail className="w-4 h-4" />
            Conoz nuestra carta
          </Button>
        </Link>
      </div>
    </div>
  );
}