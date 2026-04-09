'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MesaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/admin/mesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.get('nombre'),
          capacidad: parseInt(formData.get('capacidad') as string),
          tipo: formData.get('tipo'),
          activa: true,
        }),
      });

      if (res.ok) {
        router.refresh();
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Mesa 1"
          required
          className="w-32"
        />
      </div>
      <div>
        <Label htmlFor="capacidad">Capacidad</Label>
        <Input
          id="capacidad"
          name="capacidad"
          type="number"
          min={1}
          max={20}
          required
          className="w-20"
        />
      </div>
      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <select
          id="tipo"
          name="tipo"
          className="w-28 h-10 px-3 border rounded-md bg-background"
          defaultValue="MESA"
        >
          <option value="MESA">Mesa</option>
          <option value="BARRA">Barra</option>
        </select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Agregando...' : 'Agregar'}
      </Button>
    </form>
  );
}
