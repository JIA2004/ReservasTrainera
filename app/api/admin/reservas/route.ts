import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');
  const fechaFin = searchParams.get('fechaFin');
  const estado = searchParams.get('estado');

  // Verificar autenticación
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const where: Record<string, unknown> = {};
    
    if (fecha && fechaFin) {
      // Rango de fechas (para el calendario) - usar UTC para evitar timezone issues
      const [y1, m1, d1] = fecha.split('-').map(Number);
      const [y2, m2, d2] = fechaFin.split('-').map(Number);
      where.fecha = {
        gte: new Date(Date.UTC(y1, m1 - 1, d1)),
        lte: new Date(Date.UTC(y2, m2 - 1, d2, 23, 59, 59, 999)),
      };
    } else if (fecha) {
      // Fecha única - usar UTC midnight
      const [y, m, d] = fecha.split('-').map(Number);
      where.fecha = new Date(Date.UTC(y, m - 1, d));
    }
    
    if (estado) {
      where.estado = estado;
    }

    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        mesas: {
          include: { mesa: true },
        },
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' },
      ],
    });

    return NextResponse.json({ reservas });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
