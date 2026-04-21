import Link from 'next/link';
import Image from 'next/image';
import { ConfirmacionCard } from './ConfirmacionCard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConfirmacionPage({ params }: Props) {
  const resolvedParams = await params;
  const reservaId = resolvedParams?.id || '';
  const esTemporal = reservaId.startsWith('temp-');

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="relative w-32 h-10 block">
            <Image
              src="/imgs/LogoSinFondo.png"
              alt="Trainera"
              fill
              className="object-contain brightness-0 invert"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <ConfirmacionCard reservaId={reservaId} />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-900/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} Trainera - Cocina Vasca
          </p>
        </div>
      </footer>
    </div>
  );
}
