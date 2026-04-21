'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Users, Loader2, Wine, ArrowLeft, Armchair, LayoutDashboard, Check, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReservarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preferenciaUbicacion, setPreferenciaUbicacion] = useState<'MESA' | 'BARRA' | ''>('');
  const [soloBarraDisponible, setSoloBarraDisponible] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHora, setSelectedHora] = useState<string>('');
  const [comensales, setComensales] = useState<string>('2');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');

  // Data state
  const [horarios, setHorarios] = useState<string[]>(['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30']);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, number>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = addDays(today, 30);

  // Load disponibilidad when date changes
  useEffect(() => {
    if (!selectedDate) {
      setDisponibilidad({});
      setHorarios(['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30']);
      return;
    }

    const loadDisponibilidad = async () => {
      setLoadingSlots(true);
      setSelectedHora('');
      try {
        const fechaStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/disponibilidad?fecha=${fechaStr}`);
        const data = await res.json();

        const defaultHorarios = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
        let horariosCargados = defaultHorarios;
        const slots: Record<string, number> = {};

        if (data.disponibilidad && Array.isArray(data.disponibilidad)) {
          horariosCargados = data.disponibilidad.map((s: { hora: string }) => s.hora.trim());
          
          data.disponibilidad.forEach((slot: { hora: string; disponibles: number | null }) => {
            const horaKey = slot.hora.trim();
            slots[horaKey] = slot.disponibles !== null ? slot.disponibles : 20;
          });
        }
        
        setHorarios(horariosCargados);
        setDisponibilidad(slots);

        if (preferenciaUbicacion === 'MESA') {
          const hayMesas = Object.values(slots).some((d: unknown) => Number(d) > 0);
          setSoloBarraDisponible(!hayMesas);
        }
      } catch {
        setHorarios(['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30']);
        setDisponibilidad({});
      } finally {
        setLoadingSlots(false);
      }
    };

    loadDisponibilidad();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (soloBarraDisponible && preferenciaUbicacion !== 'BARRA') {
      setError('Solo hay lugares disponibles en la barra. Querés confirmar ahí o probamos otra fecha/horario?');
      return;
    }

    const telefonoRegex = /^\+?[0-9\s\-()]{8,20}$/;
    if (!telefonoRegex.test(telefono)) {
      setError('Por favor ingresa un telefono valido');
      return;
    }

    if (!selectedDate || !selectedHora) {
      setError('Por favor selecciona fecha y horario');
      return;
    }

    const capacidad = disponibilidad[selectedHora] ?? 0;
    if (capacidad < parseInt(comensales)) {
      setError(`No hay suficiente capacidad. Maximo ${capacidad} personas para este horario.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          telefono,
          fecha: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedHora,
          comensales: parseInt(comensales),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/confirmacion/${data.reserva.id}`);
      } else {
        setError(data.mensaje || 'Error al procesar la reserva');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const diasValidos = (date: Date) => {
    const day = date.getDay();
    return day >= 2 && day <= 6;
  };

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="bg-stone-900/80 backdrop-blur-md border-b border-stone-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="relative w-36 h-14">
            <Image
              src="/imgs/logo.jpg"
              alt="Trainera"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <Link href="/" className="text-stone-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </header>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-red-900/10 to-transparent rounded-full" />
      </div>

      {/* Content */}
      <main className="relative z-10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 mb-6 shadow-lg shadow-red-600/20">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-tight">
                Reservá tu mesa
              </h1>
              <p className="text-stone-400 max-w-lg mx-auto text-lg leading-relaxed">
                Vivi la experiencia de la cocina vasca en Trainera. 
                Te esperamos con los brazos abiertos.
              </p>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-200 px-6 py-4 rounded-xl mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fecha y horario */}
              <Card className="bg-stone-900/60 border-stone-800 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-stone-800/50 border-b border-stone-700/50 pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-red-500" />
                    </div>
                    Fecha y horario
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {/* Date picker */}
                  <div>
                    <Label className="text-stone-300 font-medium text-base mb-4 block">Selecciona una fecha</Label>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < today || date > maxDate || !diasValidos(date)}
                        fromDate={today}
                        toDate={maxDate}
                        locale={es}
                        className="rounded-xl border-stone-700 bg-stone-800/50 p-3 [&_.rdp-day]:text-stone-300 [&_.rdp-day_selected]:bg-red-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected]:font-semibold [&_.rdp-day:hover]:bg-stone-700 [&_.rdp-day:hover]:text-white [&_.rdp-day:focus]:bg-red-600 [&_.rdp-day:focus]:text-white [&_.rdp-month_caption]:text-stone-200 [&_.rdp-month_caption]:font-medium [&_.rdp-head_cell]:text-stone-500 [&_.rdp-head_cell]:font-medium [&_.rdp-day_disabled]:text-stone-600 [&_.rdp-day_disabled]:opacity-50"
                      />
                    </div>
                    <p className="text-xs text-stone-500 mt-4 text-center flex items-center justify-center gap-1">
                      <Wine className="h-3 w-3" />
                      Solo aceptamos reservas de martes a sabado
                    </p>
                  </div>

                  {/* Time selector - IMPROVED as buttons */}
                  {selectedDate && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Label className="text-stone-300 font-medium text-base mb-4 block">Selecciona un horario</Label>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                          {horarios.map((hora) => {
                            const horaKey = hora.trim();
                            const disponibles = disponibilidad[horaKey] ?? 20;
                            const puede = disponibles > 0;
                            const isSelected = selectedHora === horaKey;
                            
                            return (
                              <button
                                key={horaKey}
                                type="button"
                                disabled={!puede}
                                onClick={() => setSelectedHora(horaKey)}
                                className={`
                                  relative p-3 rounded-xl border-2 transition-all duration-200 font-medium
                                  ${isSelected 
                                    ? 'border-red-500 bg-red-600/20 text-white shadow-lg shadow-red-500/20' 
                                    : puede 
                                      ? 'border-stone-700 bg-stone-800/50 text-stone-300 hover:border-stone-600 hover:bg-stone-700/50' 
                                      : 'border-stone-800 bg-stone-900/30 text-stone-600 cursor-not-allowed opacity-50'}
                                `}
                              >
                                <span className="block text-lg">{horaKey}</span>
                                {isSelected && (
                                  <Check className="absolute -top-1 -right-1 w-4 h-4 text-red-500 bg-stone-900 rounded-full p-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comensales */}
                  {selectedHora && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Label className="text-stone-300 font-medium text-base mb-4 block">Cantidad de comensales</Label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const capacidad = disponibilidad[selectedHora] ?? 20;
                          const maximo = Math.min(capacidad, 20);
                          if (maximo < 1) return null;
                          
                          return Array.from({ length: maximo }, (_, i) => i + 1).map((n) => {
                            const isSelected = comensales === String(n);
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setComensales(String(n))}
                                className={`
                                  w-14 h-14 rounded-xl border-2 transition-all duration-200 font-medium text-lg
                                  ${isSelected 
                                    ? 'border-red-500 bg-red-600/20 text-white' 
                                    : 'border-stone-700 bg-stone-800/50 text-stone-300 hover:border-stone-600'}
                                `}
                              >
                                {n}
                              </button>
                            );
                          });
                        })()}
                      </div>
                      {(() => {
                        const capacidad = disponibilidad[selectedHora] ?? 20;
                        if (capacidad < 20 && capacidad > 0) {
                          return (
                            <p className="text-xs text-stone-500 mt-3">
                              Maximo {capacidad} comensales disponibles para este horario
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Preferencia de ubicacion */}
                  {selectedHora && comensales && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Label className="text-stone-300 font-medium text-base mb-3 block">Prefieres mesa o barra?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPreferenciaUbicacion('MESA')}
                          className={`
                            p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${preferenciaUbicacion === 'MESA' 
                                ? 'border-red-500 bg-red-600/20 text-white' 
                                : 'border-stone-700 bg-stone-800/50 text-stone-400 hover:border-stone-600'}
                          `}
                        >
                          <Armchair className="h-8 w-8" />
                          <span className="font-medium">Mesa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreferenciaUbicacion('BARRA')}
                          className={`
                            p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${preferenciaUbicacion === 'BARRA' 
                                ? 'border-red-500 bg-red-600/20 text-white' 
                                : 'border-stone-700 bg-stone-800/50 text-stone-400 hover:border-stone-600'}
                          `}
                        >
                          <LayoutDashboard className="h-8 w-8" />
                          <span className="font-medium">Barra</span>
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Datos personales */}
              <Card className="bg-stone-900/60 border-stone-800 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-stone-800/50 border-b border-stone-700/50 pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-stone-700 flex items-center justify-center">
                      <Users className="h-5 w-5 text-stone-300" />
                    </div>
                    Tus datos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="nombre" className="text-stone-300 font-medium">Nombre</Label>
                      <Input
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Tu nombre"
                        required
                        className="mt-2 border-stone-700 bg-stone-800/50 text-white placeholder:text-stone-500 focus:border-red-500 focus:ring-red-500/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellido" className="text-stone-300 font-medium">Apellido</Label>
                      <Input
                        id="apellido"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        placeholder="Tu apellido"
                        required
                        className="mt-2 border-stone-700 bg-stone-800/50 text-white placeholder:text-stone-500 focus:border-red-500 focus:ring-red-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="text-stone-300 font-medium">Telefono</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+54 9 341 555 1234"
                      required
                      className="mt-2 border-stone-700 bg-stone-800/50 text-white placeholder:text-stone-500 focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={loading || !selectedDate || !selectedHora}
                className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-lg font-semibold rounded-xl shadow-lg shadow-red-600/20 transition-all duration-200 hover:shadow-red-600/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Procesando reserva...
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-5 w-5 mr-2" />
                    Confirmar reserva
                  </>
                )}
              </Button>
            </form>

            {/* Footer note */}
            <p className="text-center text-stone-500 text-sm mt-8">
              Al confirmar, aceptas nuestros terminos y condiciones
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}