'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  reservaId: string;
}

export function CancelForm({ reservaId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCancel = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/reservas/${reservaId}/cancelar`, {
        method: 'POST',
      });

      if (res.ok) {
        router.push(`/cancelar/${reservaId}/confirmado`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al cancelar la reserva');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Warning message */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Una vez cancelada, perderás tu lugar y deberás hacer una nueva reserva.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={loading}
        >
          No, volver atrás
        </Button>
        <Button
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cancelando...
            </span>
          ) : (
            'Sí, cancelar'
          )}
        </Button>
      </div>
    </div>
  );
}
