export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { ChevronLeft, ChevronRight, Calendar, Users, Armchair, MapPin } from 'lucide-react';
import { headers } from 'next/headers';

async function getReservasDelMes(fecha: Date) {
  const start = startOfMonth(fecha);
  const end = endOfMonth(fecha);

  const reservas = await prisma.reserva.findMany({
    where: {
      fecha: {
        gte: start,
        lte: end,
      },
      estado: {
        notIn: ['CANCELADA'],
      },
    },
    select: {
      fecha: true,
    },
  });

  // Count by day
  const countByDay: Record<string, number> = {};
  reservas.forEach((r) => {
    const key = format(r.fecha, 'yyyy-MM-dd');
    countByDay[key] = (countByDay[key] || 0) + 1;
  });

  return countByDay;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  // Check auth directly
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    redirect('/admin/login');
  }

  const today = new Date();
  const params = await searchParams;
  let selectedMonth = today;
  if (params.m && /^\d{4}-\d{2}$/.test(params.m)) {
    selectedMonth = parseISO(params.m + '-01');
  }
  
  const reservasDelMes = await getReservasDelMes(selectedMonth);
  
  const totalReservas = Object.values(reservasDelMes).reduce((a, b) => a + b, 0);
  const diasConReservas = Object.keys(reservasDelMes).length;

  // Generate calendar
  const calendarStart = startOfWeek(startOfMonth(selectedMonth), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(selectedMonth), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getReservaCount = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    return reservasDelMes[key] || 0;
  };

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-stone-50';
    if (count <= 2) return 'bg-red-100';
    if (count <= 4) return 'bg-red-200';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Trainera</h1>
            <p className="text-stone-400">Panel de Administración</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button 
              type="submit"
              className="text-sm text-stone-300 hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <p className="text-stone-500 text-sm">Total reservas</p>
              <p className="text-3xl font-bold text-stone-900">{totalReservas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-stone-500 text-sm">Días con reservas</p>
              <p className="text-3xl font-bold text-stone-900">{diasConReservas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Armchair className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-stone-500 text-sm">Hoy</p>
              <p className="text-3xl font-bold text-stone-900">{format(today, 'd')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 mx-6 mb-6 overflow-hidden">
        {/* Calendar Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-stone-600" />
            <h2 className="text-xl font-semibold text-stone-900 capitalize">
              {format(selectedMonth, 'MMMM yyyy', { locale: es })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin?m=${format(subMonths(selectedMonth, 1), 'yyyy-MM')}`}
              className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <Link 
              href="/admin"
              className="px-3 py-1 text-sm text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Hoy
            </Link>
            <Link
              href={`/admin?m=${format(addMonths(selectedMonth, 1), 'yyyy-MM')}`}
              className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-stone-600" />
            </Link>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-100">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
            <div 
              key={day} 
              className="py-3 text-center text-sm font-medium text-stone-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const count = getReservaCount(day);
            const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
            const isHoy = isToday(day);

            return (
              <Link
                key={day.toISOString()}
                href={count > 0 ? `/admin/reservas/${format(day, 'yyyy-MM-dd')}` : '#'}
                className={`
                  min-h-[80px] p-2 border-b border-r border-stone-100 transition-colors
                  ${!isCurrentMonth ? 'bg-stone-50' : 'hover:bg-stone-50'}
                  ${count > 0 ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`
                    text-sm font-medium
                    ${!isCurrentMonth ? 'text-stone-300' : 'text-stone-700'}
                    ${isHoy ? 'bg-stone-900 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {count > 0 && (
                    <div className={`
                      text-xs font-bold px-1.5 py-0.5 rounded-full
                      ${count <= 2 ? 'bg-red-100 text-red-700' : 'bg-red-500 text-white'}
                    `}>
                      {count}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-6 pb-6 flex gap-4">
        <Link 
          href="/admin/config"
          className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Configuración
        </Link>
      </div>
    </div>
  );
}