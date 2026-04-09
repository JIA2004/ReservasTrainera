import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarRecordatorio } from '@/lib/email';

export async function GET(request: Request) {
  // Verificar authorization header para el cron job
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const ahora = new Date();
    const enDosHoras = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);

    // Formatear hora actual para comparación
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    const horaLimite = `${enDosHoras.getHours().toString().padStart(2, '0')}:${enDosHoras.getMinutes().toString().padStart(2, '0')}`;

    // Buscar reservas próximas (entre ahora y en 2 horas)
    const reservas = await prisma.reserva.findMany({
      where: {
        fecha: {
          gte: new Date(ahora.toDateString()),
          lte: new Date(enDosHoras.toDateString()),
        },
        hora: {
          gte: horaActual,
          lte: horaLimite,
        },
        estado: {
          in: ['PENDIENTE', 'CONFIRMADA'],
        },
        recordatorioEnviado: false,
      },
      include: {
        mesas: {
          include: { mesa: true },
        },
      },
    });

    let enviados = 0;

    for (const reserva of reservas) {
      try {
        await enviarRecordatorio(reserva);
        
        await prisma.reserva.update({
          where: { id: reserva.id },
          data: { recordatorioEnviado: true },
        });
        
        enviados++;
      } catch (error) {
        console.error(`Error enviando recordatorio para reserva ${reserva.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: reservas.length,
      sent: enviados,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error en cron de recordatorios:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
