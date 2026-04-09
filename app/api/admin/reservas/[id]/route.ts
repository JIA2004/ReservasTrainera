import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  telefono: z.string().min(8).optional(),
  comensales: z.number().int().min(1).max(20).optional(),
  estado: z.enum(['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA', 'NO_ASISTIO', 'REQUIERE_ATENCION']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const reserva = await prisma.reserva.findUnique({
      where: { id: params.id },
      include: {
        mesas: {
          include: { mesa: true },
        },
      },
    });

    if (!reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ reserva });
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const reserva = await prisma.reserva.update({
      where: { id: params.id },
      data,
      include: {
        mesas: {
          include: { mesa: true },
        },
      },
    });

    return NextResponse.json({ reserva });
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
