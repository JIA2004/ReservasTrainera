import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.configuracion.findFirst();
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    const config = await prisma.configuracion.upsert({
      where: { id: 'global' },
      update: body,
      create: {
        id: 'global',
        ...body,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
