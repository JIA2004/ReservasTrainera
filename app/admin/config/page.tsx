export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { MesaForm } from './_components/mesa-form';
import { MesaList } from './_components/mesa-list';
import { HorariosForm } from './_components/horarios-form';
import { CapacidadForm } from './_components/capacidad-form';
import { Settings, Clock, Users, LayoutGrid, ArrowLeft } from 'lucide-react';

async function getConfig() {
  const config = await prisma.configuracion.findFirst();
  return config;
}

async function getMesas() {
  const mesas = await prisma.mesa.findMany({
    orderBy: [
      { tipo: 'asc' },
      { nombre: 'asc' },
    ],
  });
  return mesas;
}

export default async function AdminConfigPage() {
  const config = await getConfig();
  const mesas = await getMesas();

  const horariosDisponibles = config?.horariosReservas?.split(',').map(h => h.trim()) || ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al calendario
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-500">Gestiona horarios, capacidad y mesas del restaurante</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Horarios */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-stone-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Horarios de reserva</h2>
                <p className="text-sm text-gray-500">Define los horarios disponibles para tus clientes</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <HorariosForm horariosDisponibles={horariosDisponibles} />
          </div>
        </div>

        {/* Capacidad */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-stone-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Capacidad</h2>
                <p className="text-sm text-gray-500">Tolerancia, días de anticipación y contacto</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <CapacidadForm 
              toleranciaMinutos={config?.toleranciaMinutos || 10}
              diasAntelacionMax={config?.diasAntelacionMax || 30}
            />
          </div>
        </div>

        {/* Mesas */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-stone-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Mesas</h2>
                <p className="text-sm text-gray-500">{mesas.length} mesas configuradas</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <MesaList initialMesas={mesas} />
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Agregar nueva mesa</h3>
              <MesaForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
