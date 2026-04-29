import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ id: string }>;
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    throw new Error('No autorizado');
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await verifyAdmin();
    const { id: reservaId } = await params;

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        mesas: {
          include: {
            mesa: true,
          },
        },
      },
    });

    if (!reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const { fecha, hora } = reserva;

    const occupiedTables = await prisma.reservaMesa.findMany({
      where: {
        reserva: {
          NOT: { id: reservaId },
          fecha: fecha,
          hora: hora,
        },
      },
      select: {
        mesaId: true,
      },
    });

    const occupiedTableIds = occupiedTables.map((rt) => rt.mesaId);

    const allTables = await prisma.mesa.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
    });

    const tablesWithAvailability = allTables.map((mesa) => ({
      ...mesa,
      estaOcupada: occupiedTableIds.includes(mesa.id),
      asignadaAReserva: reserva.mesas.some((rm) => rm.mesaId === mesa.id),
    }));

    return NextResponse.json({
      reserva,
      tables: tablesWithAvailability,
    });
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error fetching reservation tables:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    await verifyAdmin();
    const { id: reservaId } = await params;

    const body = await request.json();
    const { mesaIds } = body;

    if (!Array.isArray(mesaIds)) {
      return NextResponse.json({ error: 'mesaIds debe ser un array' }, { status: 400 });
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const { fecha, hora, comensales } = reserva;

    // 1. Capacity Validation
    const selectedTables = await prisma.mesa.findMany({
      where: { id: { in: mesaIds } },
    });

    if (selectedTables.length !== mesaIds.length) {
      return NextResponse.json({ error: 'Una o más mesas no existen' }, { status: 400 });
    }

    const totalCapacity = selectedTables.reduce((sum, m) => sum + m.capacidad, 0);
    if (totalCapacity < comensales) {
      return NextResponse.json(
        { 
          error: 'Capacidad insuficiente', 
          details: `La capacidad total (${totalCapacity}) es menor que los comensales (${comensales})` 
        }, 
        { status: 400 }
      );
    }

    // 2. Overlap Validation
    const occupiedTables = await prisma.reservaMesa.findMany({
      where: {
        reserva: {
          NOT: { id: reservaId },
          fecha: fecha,
          hora: hora,
        },
        mesaId: { in: mesaIds },
      },
      select: { mesaId: true },
    });

    if (occupiedTables.length > 0) {
      const occupiedIds = occupiedTables.map(t => t.mesaId);
      return NextResponse.json(
        { 
          error: 'Conflicto de disponibilidad', 
          details: `Las siguientes mesas ya están ocupadas en este horario: ${occupiedIds.join(', ')}` 
        }, 
        { status: 400 }
      );
    }

    // 3. Atomic Update
    await prisma.$transaction([
      prisma.reservaMesa.deleteMany({
        where: { reservaId },
      }),
      prisma.reservaMesa.createMany({
        data: mesaIds.map(mesaId => ({
          reservaId,
          mesaId,
        })),
      }),
    ]);

    return NextResponse.json({ success: true, totalCapacity });
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error updating reservation tables:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
