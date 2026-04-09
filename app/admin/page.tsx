'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReservaCount {
  [date: string]: number;
}

export default function AdminDashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [reservasDelMes, setReservasDelMes] = useState<ReservaCount>({});
  const [loading, setLoading] = useState(true);

  const today = new Date();

  useEffect(() => {
    const fetchReservas = async () => {
      setLoading(true);
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      try {
        const res = await fetch(`/api/admin/reservas?fecha=${start}&fechaFin=${end}`);
        
        if (!res.ok) {
          console.error('Error fetching reservas:', res.status, res.statusText);
          setReservasDelMes({});
          return;
        }
        
        const data = await res.json();
        
        if (data.error) {
          console.error('API Error:', data.error);
          setReservasDelMes({});
          return;
        }
        
        const countByDay: ReservaCount = {};
        if (data.reservas && Array.isArray(data.reservas)) {
          data.reservas.forEach((r: { fecha: string }) => {
            const dayKey = format(new Date(r.fecha), 'yyyy-MM-dd');
            countByDay[dayKey] = (countByDay[dayKey] || 0) + 1;
          });
        }
        setReservasDelMes(countByDay);
      } catch (error) {
        console.error('Error fetching reservas:', error);
        setReservasDelMes({});
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [selectedMonth]);

  // Generate calendar days
  const calendarStart = startOfWeek(startOfMonth(selectedMonth), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(selectedMonth), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getReservaCount = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    return reservasDelMes[key] || 0;
  };

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-stone-50';
    if (count <= 2) return 'bg-red-100 hover:bg-red-200';
    if (count <= 4) return 'bg-red-200 hover:bg-red-300';
    return 'bg-red-300 hover:bg-red-400';
  };

  const totalReservas = Object.values(reservasDelMes).reduce((a, b) => a + b, 0);
  const diasConReservas = Object.keys(reservasDelMes).length;
  const picoDelMes = Math.max(0, ...Object.values(reservasDelMes));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-gray-500 text-sm">Vista mensual de reservas</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-white/60 text-sm">Este mes</span>
          </div>
          <p className="text-4xl font-bold mb-1">
            {loading ? (
              <span className="animate-pulse">—</span>
            ) : (
              totalReservas
            )}
          </p>
          <p className="text-white/80 text-sm">reservas totales</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-gray-400 text-sm">Ocupación</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {loading ? (
              <span className="animate-pulse">—</span>
            ) : (
              diasConReservas
            )}
          </p>
          <p className="text-gray-500 text-sm">días con reservas</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-gray-400 text-sm">Máximo</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {loading ? (
              <span className="animate-pulse">—</span>
            ) : (
              picoDelMes
            )}
          </p>
          <p className="text-gray-500 text-sm">reservas en un día</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-stone-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 capitalize">
              {format(selectedMonth, 'MMMM yyyy', { locale: es })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              className="gap-1"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isSameMonth(selectedMonth, today) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMonth(today)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Hoy
              </Button>
            )}
          </div>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-stone-50 border-b border-gray-200">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
            <div 
              key={day} 
              className={`p-3 text-center text-sm font-semibold ${
                i === 6 ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const count = getReservaCount(day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
            const isSunday = day.getDay() === 0;

            return (
              <Link
                key={day.toISOString()}
                href={`/admin/reservas/${format(day, 'yyyy-MM-dd')}`}
                className={`
                  min-h-[70px] sm:min-h-[90px] p-1 sm:p-2 border-b border-r 
                  transition-all duration-200 group
                  ${!isCurrentMonth ? 'bg-stone-50/50' : ''}
                  ${getIntensityClass(count)}
                  ${isToday ? 'ring-2 ring-red-500 ring-inset' : ''}
                `}
              >
                <div className="flex justify-between items-start h-full">
                  <span className={`
                    text-xs sm:text-sm font-semibold
                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${isToday ? 'bg-red-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center' : ''}
                    ${isSunday && isCurrentMonth ? 'text-red-600' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {count > 0 && (
                    <div className={`
                      text-xs font-bold px-1.5 py-0.5 rounded-full
                      ${count <= 2 ? 'bg-red-600 text-white' : 'bg-red-800 text-white'}
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

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
        <span className="text-gray-500 font-medium">Intensidad:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-stone-100 border border-gray-200"></div>
          <span className="text-gray-600">Sin reservas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100"></div>
          <span className="text-gray-600">1-2</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-200"></div>
          <span className="text-gray-600">3-4</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-300"></div>
          <span className="text-gray-600">5+</span>
        </div>
      </div>
    </div>
  );
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}
