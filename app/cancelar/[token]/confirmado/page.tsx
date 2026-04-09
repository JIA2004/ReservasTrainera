import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function CanceladoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-xl font-bold">
            Trainera
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-4">Reserva cancelada</h1>
          <p className="text-muted-foreground mb-6">
            Tu reserva ha sido cancelada correctamente. 
            Las mesas han sido liberadas y están disponibles para otros comensales.
          </p>
          <p className="text-muted-foreground mb-6">
            Si fue un error o querés volver a reservar, podés hacerlo cuando quieras.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/reservar">
              <button className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                Hacer nueva reserva
              </button>
            </Link>
            <Link href="/">
              <button className="px-6 py-2 border rounded-md hover:bg-gray-50">
                Volver al inicio
              </button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Trainera - Cocina Vasca</p>
        </div>
      </footer>
    </div>
  );
}
