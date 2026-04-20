import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ fecha: string }>;
}

export async function GET(request: Request, { params }: Props) {
  // Verificar autenticación
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const fechaStr = resolvedParams.fecha;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    const [year, month, day] = fechaStr.split('-').map(Number);
    const fechaDate = new Date(Date.UTC(year, month - 1, day));

    // Obtener todas las reservas para ese día (no canceladas)
    const reservas = await prisma.reserva.findMany({
      where: {
        fecha: fechaDate,
        estado: {
          notIn: ['CANCELADA'],
        },
      },
      include: {
        mesas: {
          include: { mesa: true },
        },
      },
      orderBy: {
        hora: 'asc',
      },
    });

    // Agrupar por horario
    const porHorario: Record<string, typeof reservas> = {};
    reservas.forEach((reserva) => {
      if (!porHorario[reserva.hora]) {
        porHorario[reserva.hora] = [];
      }
      porHorario[reserva.hora].push(reserva);
    });

    return NextResponse.json({ reservas, porHorario });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}