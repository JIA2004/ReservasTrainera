import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ id: string }>;
}

// Asignar mesa a reserva
export async function POST(request: Request, { params }: Props) {
  // Verificar autenticación
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const reservaId = resolvedParams.id;

    const body = await request.json();
    const { mesaId } = body;

    if (!mesaId) {
      return NextResponse.json(
        { error: 'mesaId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { mesas: true },
    });

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la mesa existe
    const mesa = await prisma.mesa.findUnique({
      where: { id: mesaId },
    });

    if (!mesa) {
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya está asignada
    const yaAsignada = reserva.mesas.some((rm) => rm.mesaId === mesaId);
    if (yaAsignada) {
      return NextResponse.json(
        { error: 'La mesa ya está asignada a esta reserva' },
        { status: 400 }
      );
    }

    // Crear la asignación
    const reservaMesa = await prisma.reservaMesa.create({
      data: {
        reservaId,
        mesaId,
      },
    });

    return NextResponse.json({ reservaMesa }, { status: 201 });
  } catch (error) {
    console.error('Error al asignar mesa:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

// Desasignar mesa de reserva
export async function DELETE(request: Request, { params }: Props) {
  // Verificar autenticación
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const reservaId = resolvedParams.id;

    const { searchParams } = new URL(request.url);
    const mesaId = searchParams.get('mesaId');

    if (!mesaId) {
      return NextResponse.json(
        { error: 'mesaId es requerido' },
        { status: 400 }
      );
    }

    // Eliminar la asignación
    await prisma.reservaMesa.delete({
      where: {
        reservaId_mesaId: {
          reservaId,
          mesaId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al desasignar mesa:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}