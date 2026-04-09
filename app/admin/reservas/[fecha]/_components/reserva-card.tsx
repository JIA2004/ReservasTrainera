'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Mail, Users, Armchair, MoreHorizontal, Check, X, AlertTriangle } from 'lucide-react';

interface Reserva {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  comensales: number;
  estado: string;
  mesas: { mesa: { nombre: string } }[];
}

interface Props {
  reserva: Reserva;
}

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'PENDIENTE':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Pendiente</Badge>;
    case 'CONFIRMADA':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Confirmada</Badge>;
    case 'COMPLETADA':
      return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200">Completada</Badge>;
    case 'NO_ASISTIO':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">No asistió</Badge>;
    case 'REQUIERE_ATENCION':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Requiere atención
      </Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

export function ReservaCard({ reserva }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleAction = async (newEstado: string) => {
    setLoading(newEstado);
    setError(null);
    setShowMenu(false);

    try {
      const res = await fetch(`/api/admin/reservas/${reserva.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(null);
    }
  };

  const puedeConfirmar = reserva.estado === 'PENDIENTE' || reserva.estado === 'REQUIERE_ATENCION';
  const puedeCompletar = reserva.estado === 'CONFIRMADA';
  const puedeCancelar = reserva.estado !== 'CANCELADA' && reserva.estado !== 'COMPLETADA' && reserva.estado !== 'NO_ASISTIO';
  const puedeMarcarNoAsistio = reserva.estado === 'CONFIRMADA' || reserva.estado === 'COMPLETADA';

  const getAccionColor = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA': return 'bg-green-600 hover:bg-green-700';
      case 'CANCELADA': return 'bg-red-600 hover:bg-red-700';
      case 'NO_ASISTIO': return 'bg-red-600 hover:bg-red-700';
      case 'COMPLETADA': return 'bg-gray-600 hover:bg-gray-700';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Main info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Avatar con iniciales */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                {reserva.nombre.charAt(0)}{reserva.apellido.charAt(0)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {reserva.nombre} {reserva.apellido}
                </h4>
                {getEstadoBadge(reserva.estado)}
              </div>
            </div>
          </div>
          
          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <a href={`tel:${reserva.telefono}`} className="hover:text-red-600 transition-colors">
                {reserva.telefono}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${reserva.email}`} className="hover:text-red-600 transition-colors truncate">
                {reserva.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{reserva.comensales} comensales</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Armchair className="w-4 h-4 text-gray-400" />
              <span className={reserva.mesas.length === 0 ? 'text-amber-600' : ''}>
                {reserva.mesas.length > 0 
                  ? reserva.mesas.map((m) => m.mesa.nombre).join(', ')
                  : 'Sin asignar'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:ml-4">
          {error && (
            <span className="text-sm text-red-600 lg:hidden">{error}</span>
          )}
          
          {/* Quick action button (primary action) */}
          {puedeConfirmar && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white gap-1"
              onClick={() => handleAction('CONFIRMADA')}
              disabled={loading !== null}
            >
              {loading === 'CONFIRMADA' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          )}

          {/* More actions menu */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="gap-1"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                  {puedeCompletar && (
                    <button
                      onClick={() => handleAction('COMPLETADA')}
                      disabled={loading !== null}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                      Completar
                    </button>
                  )}
                  {puedeMarcarNoAsistio && (
                    <button
                      onClick={() => handleAction('NO_ASISTIO')}
                      disabled={loading !== null}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-red-600" />
                      No asistió
                    </button>
                  )}
                  {puedeCancelar && (
                    <button
                      onClick={() => handleAction('CANCELADA')}
                      disabled={loading !== null}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancelar reserva
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          
          {error && (
            <span className="text-sm text-red-600 hidden lg:block">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
