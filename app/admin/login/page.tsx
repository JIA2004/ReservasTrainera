'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ChefHat } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const from = new URLSearchParams(window.location.search).get('from') || '/admin';
        router.push(from);
        router.refresh();
      } else {
        setError('Contraseña incorrecta');
      }
    } catch {
      setError('Error al intentar iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="relative w-32 h-24 mx-auto mb-4">
              <Image
                src="/imgs/LogoSinFondo.png"
                alt="Trainera"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Panel de Administración</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-white">
              <ChefHat className="w-5 h-5" />
              <span className="font-semibold">Acceso restringido</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Ingresá tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg py-6"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-medium"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⟳</span>
                    Verificando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
