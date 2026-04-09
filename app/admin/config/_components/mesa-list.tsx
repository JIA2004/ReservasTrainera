'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Mesa {
  id: string;
  nombre: string;
  capacidad: number;
  tipo: 'MESA' | 'BARRA';
  activa: boolean;
}

interface Props {
  initialMesas: Mesa[];
}

export function MesaList({ initialMesas }: Props) {
  const router = useRouter();
  const [mesas, setMesas] = useState(initialMesas);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Mesa>>({});

  const handleEdit = (mesa: Mesa) => {
    setEditingId(mesa.id);
    setEditData(mesa);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/mesas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const updated = await res.json();
        setMesas(mesas.map((m) => (m.id === id ? updated.mesa : m)));
        setEditingId(null);
        router.refresh();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa?')) return;

    try {
      const res = await fetch(`/api/admin/mesas/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMesas(mesas.filter((m) => m.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleActiva = async (id: string, activa: boolean) => {
    try {
      const res = await fetch(`/api/admin/mesas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMesas(mesas.map((m) => (m.id === id ? updated.mesa : m)));
        router.refresh();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-2">
      {mesas.map((mesa) => (
        <div
          key={mesa.id}
          className={`flex items-center gap-4 p-3 border rounded-lg ${
            !mesa.activa ? 'bg-gray-50 opacity-60' : ''
          }`}
        >
          {editingId === mesa.id ? (
            <>
              <Input
                value={editData.nombre}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                className="w-32"
              />
              <Input
                type="number"
                value={editData.capacidad}
                onChange={(e) =>
                  setEditData({ ...editData, capacidad: parseInt(e.target.value) })
                }
                className="w-20"
                min={1}
                max={20}
              />
              <select
                value={editData.tipo}
                onChange={(e) =>
                  setEditData({ ...editData, tipo: e.target.value as 'MESA' | 'BARRA' })
                }
                className="h-10 px-3 border rounded-md bg-background"
              >
                <option value="MESA">Mesa</option>
                <option value="BARRA">Barra</option>
              </select>
              <Button onClick={() => handleSave(mesa.id)} size="sm">
                Guardar
              </Button>
              <Button onClick={() => setEditingId(null)} variant="ghost" size="sm">
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <span className="w-32 font-medium">{mesa.nombre}</span>
              <span className="w-16 text-muted-foreground">{mesa.capacidad} personas</span>
              <span className="w-16 text-sm text-muted-foreground">
                {mesa.tipo === 'BARRA' ? 'Barra' : 'Mesa'}
              </span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mesa.activa}
                  onChange={(e) => handleToggleActiva(mesa.id, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-muted-foreground">Activa</span>
              </label>
              <div className="flex-1" />
              <Button onClick={() => handleEdit(mesa)} variant="ghost" size="sm">
                Editar
              </Button>
              <Button
                onClick={() => handleDelete(mesa.id)}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Eliminar
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
