'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

interface Reserva {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha: string;
  hora: string;
  comensales: number;
  estado: string;
  mesas: { mesa: { nombre: string } }[];
}

export default function EditarReservaPage() {
  const router = useRouter();
  const params = useParams();
  const reservaId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reserva, setReserva] = useState<Reserva | null>(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [comensales, setComensales] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        const res = await fetch(`/api/admin/reservas/${reservaId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Error al cargar reserva');
          return;
        }

        setReserva(data.reserva);
        setNombre(data.reserva.nombre);
        setApellido(data.reserva.apellido);
        setTelefono(data.reserva.telefono);
        setComensales(String(data.reserva.comensales));
        setEstado(data.reserva.estado);
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchReserva();
  }, [reservaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/reservas/${reservaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          telefono,
          comensales: parseInt(comensales),
          estado,
        }),
      });

      if (res.ok) {
        router.push(`/admin/reservas/${reserva?.fecha.split('T')[0]}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error de conexión');
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

  const fechaOriginal = new Date(reserva.fecha);
  const fechaFormateada = fechaOriginal.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/admin/reservas/${reserva.fecha.split('T')[0]}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al día
      </Link>

      <h1 className="text-2xl font-bold mb-2">Editar Reserva</h1>
      <p className="text-muted-foreground mb-6">
        {reserva.nombre} {reserva.apellido} - {fechaFormateada} a las {reserva.hora.substring(0, 5)}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-600 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={reserva.email}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">El email no se puede modificar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalles de la reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comensales">Comensales</Label>
              <Select value={comensales} onValueChange={setComensales}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? 'persona' : 'personas'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                  <SelectItem value="NO_ASISTIO">No asistió</SelectItem>
                  <SelectItem value="REQUIERE_ATENCION">⚠️ Requiere atención</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
          <Link href={`/admin/reservas/${reserva.fecha.split('T')[0]}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}