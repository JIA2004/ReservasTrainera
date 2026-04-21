'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Users, Loader2, Wine, ArrowLeft, Armchair, LayoutDashboard, AlertTriangle } from 'lucide-react';
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
  const [email, setEmail] = useState('');
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

        // Check if only barra is available for this date
        if (preferenciaUbicacion === 'MESA') {
          const hayMesas = Object.values(slots).some((d: any) => d > 0);
          setSoloBarraDisponible(!hayMesas);
        }
      } catch (err) {
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

    // Check if only barra is available and user prefers mesa
    if (soloBarraDisponible && preferenciaUbicacion !== 'BARRA') {
      setError('⚠️ Solo hay lugares disponibles en la barra. ¿Querés confirmar ahí o probamos otra fecha/horario?');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    const telefonoRegex = /^\+?[0-9\s\-()]{8,20}$/;
    if (!telefonoRegex.test(telefono)) {
      setError('Por favor ingresa un teléfono válido');
      return;
    }

    if (!selectedDate || !selectedHora) {
      setError('Por favor seleccioná fecha y horario');
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
          email,
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
      <header className="bg-stone-900 border-b border-stone-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="relative w-36 h-14">
            <Image
              src="/imgs/logo.jpg"
              alt="Trainera"
              fill
              className="object-contain"
            />
          </Link>
          <Link href="/" className="text-stone-400 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </header>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <main className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand/30 mb-6">
                <CalendarDays className="h-10 w-10 text-brand" />
              </div>
              <h1 className="text-5xl font-serif text-white mb-4">
                Reservá tu mesa
              </h1>
              <p className="text-stone-400 max-w-md mx-auto text-lg">
                Viví la experiencia de la cocina vasca en Trainera. 
                Te esperamos con los brazos abiertos.
              </p>
            </div>

            {error && (
              <div className="bg-brand/30 border border-brand text-brand px-6 py-4 rounded-lg mb-8 max-w-2xl mx-auto">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Fecha y horario */}
              <Card className="mb-8 bg-stone-900 border-stone-800">
                <CardHeader className="bg-stone-800/50 rounded-t-lg border-b border-stone-700">
                  <CardTitle className="text-xl flex items-center gap-3 text-white">
                    <CalendarDays className="h-6 w-6 text-brand" />
                    Fecha y horario
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-8 bg-stone-900/50 rounded-b-lg">
                  {/* Date picker */}
                  <div>
                    <Label className="text-stone-300 font-medium text-lg">Seleccioná una fecha</Label>
                    <div className="mt-4 flex justify-center overflow-x-auto">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < today || date > maxDate || !diasValidos(date)}
                        fromDate={today}
                        toDate={maxDate}
                        locale={es}
                        className="rounded-lg border-stone-700 bg-stone-800 [&_.rdp-day]:text-stone-200 [&_.rdp-day_selected]:bg-brand [&_.rdp-day_selected]:text-white"
                      />
                    </div>
                    <p className="text-xs text-stone-500 mt-4 text-center">
                      ✦ Solo aceptamos reservas de martes a sábado
                    </p>
                  </div>

                  {/* Time selector */}
                  {selectedDate && (
                    <div>
                      <Label className="text-stone-300 font-medium text-lg">Seleccioná un horario</Label>
                      <Select value={selectedHora} onValueChange={setSelectedHora}>
                        <SelectTrigger className="mt-4 border-stone-600 bg-stone-800 text-white">
                          <SelectValue placeholder="Elegí un horario" className="text-stone-400" />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-800 border-stone-700">
                          {horarios.map((hora) => {
                            const horaKey = hora.trim();
                            const disponibles = disponibilidad[horaKey] ?? 20;
                            const puede = disponibles > 0;
                            return (
                              <SelectItem 
                                key={horaKey} 
                                value={horaKey}
                                className="text-stone-200 hover:bg-stone-700 focus:bg-stone-700"
                              >
                                <div className="flex items-center justify-between w-full py-2">
                                  <span className="font-semibold text-lg">{horaKey}</span>
                                  <span className={`ml-4 text-sm ${puede ? 'text-brand' : 'text-gray-400'}`}>
                                    {puede ? `${disponibles} lugares` : 'Completo'}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {loadingSlots && (
                        <p className="text-sm text-stone-500 mt-3 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Cargando disponibilidad...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Comensales */}
                  {selectedHora && (
                    <div>
                      <Label className="text-stone-300 font-medium text-lg">Cantidad de comensales</Label>
                      <Select value={comensales} onValueChange={(val) => setComensales(val)}>
                        <SelectTrigger className="mt-4 border-stone-600 bg-stone-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-800 border-stone-700">
                          {(() => {
                            const capacidad = disponibilidad[selectedHora] ?? 20;
                            const maximo = Math.min(capacidad, 20);
                            if (maximo < 1) {
                              return (
                                <div className="p-4 text-center text-stone-400">
                                  No hay disponibilidad para este horario
                                </div>
                              );
                            }
                            return Array.from({ length: maximo }, (_, i) => i + 1).map((n) => (
                              <SelectItem 
                                key={n} 
                                value={String(n)}
                                className="text-stone-200 hover:bg-stone-700"
                              >
                                {n} {n === 1 ? 'comensal' : 'comensales'}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      {(() => {
                        const capacidad = disponibilidad[selectedHora] ?? 20;
                        if (capacidad < 20 && capacidad > 0) {
                          return (
                            <p className="text-xs text-stone-500 mt-2">
                              Máximo {capacidad} comensales disponibles para este horario
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Preferencia de ubicación */}
                  {selectedHora && comensales && (
                    <div>
                      <Label className="text-stone-300 font-medium text-lg">¿Prefieres mesa o barra?</Label>
                      <p className="text-sm text-stone-500 mt-1 mb-3">
                        Te avisamos si solo hay barra disponible
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPreferenciaUbicacion('MESA')}
                          className={`
                            p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${preferenciaUbicacion === 'MESA' 
                              ? 'border-brand bg-brand/20 text-white' 
                              : 'border-stone-600 bg-stone-800 text-stone-400 hover:border-stone-500'}
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
                              ? 'border-brand bg-brand/20 text-white' 
                              : 'border-stone-600 bg-stone-800 text-stone-400 hover:border-stone-500'}
                          `}
                        >
                          <LayoutDashboard className="h-8 w-8" />
                          <span className="font-medium">barra</span>
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Datos personales */}
              <Card className="mb-8 bg-stone-900 border-stone-800">
                <CardHeader className="bg-stone-800/50 rounded-t-lg border-b border-stone-700">
                  <CardTitle className="text-xl flex items-center gap-3 text-white">
                    <Users className="h-6 w-6 text-brand" />
                    Tus datos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-6 bg-stone-900/50 rounded-b-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="nombre" className="text-stone-300 font-medium">Nombre</Label>
                      <Input
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Tu nombre"
                        required
                        className="mt-3 border-stone-600 bg-stone-800 text-white placeholder:text-stone-500"
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
                        className="mt-3 border-stone-600 bg-stone-800 text-white placeholder:text-stone-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-stone-300 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="mt-3 border-stone-600 bg-stone-800 text-white placeholder:text-stone-500"
                    />
                    <p className="text-xs text-stone-500 mt-2">
                      Te enviaremos la confirmación a este email
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="text-stone-300 font-medium">Teléfono</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+54 9 341 555 1234"
                      required
                      className="mt-3 border-stone-600 bg-stone-800 text-white placeholder:text-stone-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-brand hover:bg-brand/90 text-white border-0 py-7 text-xl font-semibold"
                disabled={loading || !selectedDate || !selectedHora}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Procesando reserva...
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-6 w-6 mr-3" />
                    Confirmar reserva
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-stone-500 mt-6">
                Al confirmar, aceptás nuestra política de reservas.
                <br />
                ✦ Tolerancia de 10 minutos sobre el horario reservado.
              </p>
            </form>

            {/* Carta link */}
            <div className="mt-10 text-center">
              <a 
                href="https://taberna.trainera.com.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-gray-300 font-medium text-lg"
              >
                <Wine className="h-5 w-5" />
                Ver nuestra carta
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 border-t border-stone-800">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Trainera - Cocina Vasca</p>
        </div>
      </footer>
    </div>
  );
}