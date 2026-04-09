'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, CalendarDays, Clock, Users, MapPin, Phone, Mail, Calendar, XCircle, RefreshCw } from 'lucide-react';

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
    // Check if it's a temp reservation from URL params or localStorage
    if (reservaId.startsWith('temp-')) {
      setEsTemporal(true);
      setLoading(false);
      return;
    }

    // Try to get from localStorage
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
        <div className="h-64 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl" />
      </div>
    );
  }

  // Fallback for temp reservations
  if (esTemporal || !reserva) {
    return (
      <div className="max-w-md mx-auto">
        {/* Hero Success */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Reserva recibida!
          </h1>
          <p className="text-gray-600">
            Te contactaremos pronto para confirmar los detalles.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <p className="text-white font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              ¡Gracias por tu reserva!
            </p>
          </div>
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Importante:</strong> Tenemos una tolerancia de <span className="font-semibold">10 minutos</span> al horario de reserva. Te esperamos con gusto.
              </p>
            </div>

            <div className="space-y-3 text-gray-600 mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-600" />
                <span>Constitución 306, Rosario</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-600" />
                <span>3416-880752</span>
              </div>
            </div>

            <Link href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Reserva confirmada!
        </h1>
        <p className="text-gray-600">
          Te enviamos los detalles a tu email
        </p>
      </div>

      {/* Reservation Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
        {/* Header with brand color */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
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
          <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-red-600">
                {reserva.comensales}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">A nombre de</p>
              <p className="font-semibold text-gray-900">
                {reserva.nombre} {reserva.apellido}
              </p>
            </div>
          </div>

          {/* Time and guests */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Horario</p>
                <p className="font-medium text-gray-900">{formatTime(reserva.hora)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Comensales</p>
                <p className="font-medium text-gray-900">{reserva.comensales}</p>
              </div>
            </div>
          </div>

          {/* Important notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Nota:</strong> Tolerancia de <span className="font-semibold">10 min</span> al horario. Te esperamos con gusto.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <p className="text-center text-gray-600 text-sm mb-4">
          ¿Necesitás hacer algún cambio?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/reprogramar/${reserva.cancelToken}`}>
            <Button variant="outline" className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Reprogramar
            </Button>
          </Link>
          <Link href={`/cancelar/${reserva.cancelToken}`}>
            <Button variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
              <XCircle className="w-4 h-4" />
              Cancelar
            </Button>
          </Link>
        </div>
      </div>

      {/* Location card */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-600" />
          Cómo llegar
        </h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p>Constitución 306</p>
          <p>Entre Catamarca y Tucumán</p>
          <p>Rosario, Santa Fe</p>
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-gray-400" />
          <a href="tel:+543416880752" className="text-gray-600 hover:text-red-600">
            3416-880752
          </a>
        </div>
      </div>

      {/* Menu CTA */}
      <div className="mt-6 text-center">
        <Link href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer">
          <Button variant="link" className="text-green-600 gap-2">
            <Mail className="w-4 h-4" />
            Conocé nuestra carta
          </Button>
        </Link>
      </div>
    </div>
  );
}
