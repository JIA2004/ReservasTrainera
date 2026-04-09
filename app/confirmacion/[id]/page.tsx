import Link from 'next/link';
import Image from 'next/image';
import { ConfirmacionCard } from './ConfirmacionCard';

interface Props {
  params: { id: string };
}

export default async function ConfirmacionPage({ params }: Props) {
  const esTemporal = params.id.startsWith('temp-');

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="relative w-32 h-10 block">
            <Image
              src="/imgs/LogoSinFondo.png"
              alt="Trainera"
              fill
              className="object-contain"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <ConfirmacionCard reservaId={params.id} />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Trainera - Cocina Vasca
          </p>
        </div>
      </footer>
    </div>
  );
}
