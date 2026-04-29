'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Table {
  id: string;
  nombre: string;
  capacidad: number;
  estaOcupada: boolean;
  asignadaAReserva: boolean;
}

interface Reserva {
  id: string;
  nombre: string;
  apellido: string;
  comensales: number;
  fecha: string;
  hora: string;
}

export default function ManualTableAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const reservaId = params.id as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/reservas/${reservaId}/mesas`);
        const data = await res.json();

        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error || 'Error al cargar datos',
            variant: 'destructive',
          });
          return;
        }

        setReserva(data.reserva);
        setTables(data.tables);
        const assignedIds = data.tables
          .filter((t: Table) => t.asignadaAReserva)
          .map((t: Table) => t.id);
        setSelectedTableIds(assignedIds);
      } catch {
        toast({
          title: 'Error',
          description: 'Error de conexión',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reservaId, toast]);

  const toggleTable = (id: string, estaOcupada: boolean) => {
    if (estaOcupada) {
      toast({
        title: 'Mesa Ocupada',
        description: 'Esta mesa está ocupada por otra reserva',
        variant: 'destructive',
      });
      return;
    }
    setSelectedTableIds((prev) => 
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!reserva) return;

    const totalCapacity = tables
      .filter((t) => selectedTableIds.includes(t.id))
      .reduce((sum, t) => sum + t.capacidad, 0);

    if (totalCapacity < reserva.comensales) {
      toast({
        title: 'Capacidad Insuficiente',
        description: `La capacidad total (${totalCapacity}) es menor que los comensales (${reserva.comensales})`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reservas/${reservaId}/mesas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesaIds: selectedTableIds }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Éxito',
          description: 'Mesas asignadas correctamente',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar',
          variant: 'destructive',
        });
        if (data.details) {
          toast({
            title: 'Detalle',
            description: data.details,
          });
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Reserva no encontrada</p>
        <Link href="/admin">
          <Button variant="link" className="mt-4">Volver al admin</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/admin/reservas/${reserva.fecha.split('T')[0]}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al día
      </Link>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Gestión de Mesas</h1>
          <p className="text-muted-foreground">
            Reserva de {reserva.nombre} {reserva.apellido} — {reserva.comensales} personas
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Capacidad Seleccionada</p>
          <p className={`text-2xl font-bold ${
            tables.filter(t => selectedTableIds.includes(t.id)).reduce((sum, t) => sum + t.capacidad, 0) >= reserva.comensales 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {tables.filter(t => selectedTableIds.includes(t.id)).reduce((sum, t) => sum + t.capacidad, 0)} / {reserva.comensales}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Mesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {tables.map((table) => {
                  const isSelected = selectedTableIds.includes(table.id);
                  const isOccupied = table.estaOcupada;
                  
                  return (
                    <button
                      key={table.id}
                      onClick={() => toggleTable(table.id, isOccupied)}
                      disabled={isOccupied}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all text-center
                        ${isOccupied 
                          ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-60' 
                          : isSelected 
                            ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' 
                            : 'bg-background border-input hover:border-primary'}
                      `}
                    >
                      <div className="font-bold">{table.nombre}</div>
                      <div className="text-xs opacity-80">Cap: {table.capacidad}</div>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                      {isOccupied && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                          <AlertCircle className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex gap-6 text-sm justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-background border border-input" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Seleccionada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted border border-muted" />
                  <span>Ocupada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p>Asigna las mesas necesarias para cubrir la capacidad de la reserva.</p>
                <p className="text-muted-foreground">
                  Puedes seleccionar múltiples mesas. El sistema validará que no haya solapamientos con otras reservas.
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleSave} 
                disabled={saving || selectedTableIds.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Asignación'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
